export function shortAddr(addr: string): string {
  if (!addr.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatAmount(value: bigint, decimals = 18, maxFrac = 6): string {
  if (value === 0n) return "0";
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  if (frac === 0n) return `${negative ? "-" : ""}${whole.toString()}`;
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFrac);
  fracStr = fracStr.replace(/0+$/, "");
  const wholeStr = whole.toString();
  const grouped = wholeStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${fracStr ? `.${fracStr}` : ""}`;
}

export function formatGwei(wei: bigint): string {
  return formatAmount(wei, 9, 4);
}

export function formatEth(wei: bigint): string {
  return formatAmount(wei, 18, 6);
}
