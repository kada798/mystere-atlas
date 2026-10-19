'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function DebugPanel() {
  const t = useTranslations('Debug');
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    'idle',
  );

  function increment() {
    // Set a client-side breakpoint here, then click the counter button.
    setCount((value) => value + 1);
  }

  async function checkServer() {
    setStatus('loading');
    try {
      const response = await fetch('/api/health');
      const body = await response.json();
      setStatus(response.ok && body.status === 'ok' ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="debug-panel" aria-labelledby="debug-heading">
      <div>
        <p className="eyebrow">LOCAL DEVELOPMENT</p>
        <h2 id="debug-heading">{t('title')}</h2>
        <p>{t('description')}</p>
      </div>
      <div className="debug-actions">
        <button type="button" onClick={increment}>
          {t('counter', { count })}
        </button>
        <button
          type="button"
          onClick={checkServer}
          disabled={status === 'loading'}
        >
          {t('health')}
        </button>
        <span role="status">{t(status)}</span>
      </div>
    </section>
  );
}
