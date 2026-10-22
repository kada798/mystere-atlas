'use client';

import Image from 'next/image';
import { useState } from 'react';
import { safeCoverUrl } from '../media';

export function WorkCover({
  url,
  alt,
  missing,
}: {
  url?: string;
  alt: string;
  missing: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = safeCoverUrl(url);
  return src && !failed ? (
    <Image
      className="work-cover-image"
      src={src}
      alt={alt}
      width={220}
      height={330}
      unoptimized
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="work-cover-missing">
      <span aria-hidden="true">MA</span>
      <span>{missing}</span>
    </div>
  );
}
