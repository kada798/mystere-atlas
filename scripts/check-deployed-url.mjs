const raw = process.env.DEPLOYED_URL ?? '';
if (!/^https:\/\/\S+$/.test(raw))
  throw new Error('The deployment result is not a single HTTPS URL.');
const url = new URL(raw);
if (
  url.protocol !== 'https:' ||
  url.username ||
  url.password ||
  url.hash ||
  url.search ||
  !url.hostname.endsWith('.vercel.app') ||
  url.pathname !== '/'
)
  throw new Error(
    'The deployment command did not return a valid Vercel HTTPS URL.',
  );
