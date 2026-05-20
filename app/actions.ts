"use server";

import { decodeTx } from "@/lib/decoder";
import { parseTxInput } from "@/lib/parse-input";
import { toJSON, type Json } from "@/lib/serialize";

export type DecodeResult =
  | { ok: true; data: Json }
  | { ok: false; error: string };

export async function decodeAction(input: string): Promise<DecodeResult> {
  const hash = parseTxInput(input);
  if (!hash) {
    return {
      ok: false,
      error: "Couldn't read that — paste an Etherscan tx URL or a 0x… tx hash.",
    };
  }
  try {
    const decoded = await decodeTx(hash);
    return { ok: true, data: toJSON(decoded) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("not found") || msg.includes("could not be found")) {
      return { ok: false, error: "Transaction not found on Ethereum mainnet." };
    }
    return { ok: false, error: `RPC error: ${msg}` };
  }
}
