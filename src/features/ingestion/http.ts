export const importerHeaders = {
  'User-Agent': 'MystereAtlas/0.1 (+https://github.com/kada798/mystere-atlas)',
  Accept: 'application/json',
};
export async function fetchJson(url: string | URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: importerHeaders,
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
