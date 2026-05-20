import { erc20Abi } from "viem";
import { ethClient } from "../viem";
import type { TokenInfo } from "./types";

const cache = new Map<string, TokenInfo>();

export async function loadTokenInfo(address: `0x${string}`): Promise<TokenInfo> {
  const key = address.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const results = await ethClient.multicall({
    allowFailure: true,
    contracts: [
      { address, abi: erc20Abi, functionName: "name" },
      { address, abi: erc20Abi, functionName: "symbol" },
      { address, abi: erc20Abi, functionName: "decimals" },
    ],
  });

  const info: TokenInfo = {
    address,
    name: results[0].status === "success" ? (results[0].result as string) : undefined,
    symbol: results[1].status === "success" ? (results[1].result as string) : undefined,
    decimals: results[2].status === "success" ? Number(results[2].result) : undefined,
  };
  cache.set(key, info);
  return info;
}

export async function loadTokenInfos(addresses: `0x${string}`[]): Promise<Map<string, TokenInfo>> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase()))) as `0x${string}`[];
  const infos = await Promise.all(unique.map((a) => loadTokenInfo(a)));
  const map = new Map<string, TokenInfo>();
  infos.forEach((info, i) => map.set(unique[i], info));
  return map;
}
