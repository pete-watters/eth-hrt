const TX_HASH = /^0x[0-9a-fA-F]{64}$/;

export function parseTxInput(input: string): `0x${string}` | null {
  const trimmed = input.trim();
  if (TX_HASH.test(trimmed)) return trimmed as `0x${string}`;
  try {
    const url = new URL(trimmed);
    if (!/etherscan\.io$/.test(url.hostname.replace(/^www\./, ""))) return null;
    const fromPath = url.pathname.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
    if (fromPath) return fromPath[1] as `0x${string}`;
    const fromQuery = url.searchParams.get("txhash") || url.searchParams.get("hash");
    if (fromQuery && TX_HASH.test(fromQuery)) return fromQuery as `0x${string}`;
  } catch {
    return null;
  }
  return null;
}
