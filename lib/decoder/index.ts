import {
  decodeAbiParameters,
  parseAbiParameters,
  type Hex,
  type Log,
} from "viem";
import { ethClient } from "../viem";
import { loadTokenInfos } from "./erc20-meta";
import { TOPICS } from "./topics";
import { formatAmount, formatEth, shortAddr } from "./format";
import type {
  DecodedApproval,
  DecodedSafeEvent,
  DecodedSwap,
  DecodedTransfer,
  DecodedTx,
  TokenInfo,
  TxKind,
} from "./types";

const MAX_UINT256 = (1n << 256n) - 1n;

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function topicToAddress(topic: Hex): `0x${string}` {
  return ("0x" + topic.slice(26)) as `0x${string}`;
}

function isErc721Transfer(log: Log): boolean {
  // ERC721 Transfer has 4 topics (from, to, tokenId all indexed), ERC20 has 3.
  return log.topics.length === 4;
}

export async function decodeTx(hash: `0x${string}`): Promise<DecodedTx> {
  const [tx, receipt] = await Promise.all([
    ethClient.getTransaction({ hash }),
    ethClient.getTransactionReceipt({ hash }),
  ]);

  let blockTimestamp: bigint | undefined;
  try {
    const block = await ethClient.getBlock({ blockNumber: receipt.blockNumber });
    blockTimestamp = block.timestamp;
  } catch {
    blockTimestamp = undefined;
  }

  const logs = receipt.logs;
  const tokenAddresses = new Set<`0x${string}`>();
  for (const log of logs) {
    if (
      log.topics[0] === TOPICS.Transfer ||
      log.topics[0] === TOPICS.Approval ||
      log.topics[0] === TOPICS.ApprovalForAll
    ) {
      tokenAddresses.add(log.address);
    }
  }
  const tokenMeta = await loadTokenInfos([...tokenAddresses]);

  const transfers: DecodedTransfer[] = [];
  const approvals: DecodedApproval[] = [];
  const swaps: DecodedSwap[] = [];
  const safeEvents: DecodedSafeEvent[] = [];

  for (const log of logs) {
    const t0 = log.topics[0];
    if (!t0) continue;

    if (t0 === TOPICS.Transfer) {
      const token = tokenMeta.get(log.address.toLowerCase()) ?? { address: log.address };
      const from = topicToAddress(log.topics[1] as Hex);
      const to = topicToAddress(log.topics[2] as Hex);
      if (isErc721Transfer(log)) {
        const tokenId = BigInt(log.topics[3] as Hex);
        transfers.push({ token, from, to, amount: 1n, tokenId });
      } else {
        const [amount] = decodeAbiParameters(parseAbiParameters("uint256"), log.data) as [bigint];
        transfers.push({ token, from, to, amount });
      }
      continue;
    }

    if (t0 === TOPICS.Approval) {
      const token = tokenMeta.get(log.address.toLowerCase()) ?? { address: log.address };
      const owner = topicToAddress(log.topics[1] as Hex);
      const spender = topicToAddress(log.topics[2] as Hex);
      // ERC721 Approval indexes the tokenId as a 4th topic; ERC20 carries amount in data.
      if (log.topics.length === 4) {
        approvals.push({
          token,
          owner,
          spender,
          tokenId: BigInt(log.topics[3] as Hex),
          standard: "ERC721",
        });
      } else {
        const [amount] = decodeAbiParameters(parseAbiParameters("uint256"), log.data) as [bigint];
        approvals.push({ token, owner, spender, amount, standard: "ERC20" });
      }
      continue;
    }

    if (t0 === TOPICS.ApprovalForAll) {
      const token = tokenMeta.get(log.address.toLowerCase()) ?? { address: log.address };
      const owner = topicToAddress(log.topics[1] as Hex);
      const operator = topicToAddress(log.topics[2] as Hex);
      const [approved] = decodeAbiParameters(parseAbiParameters("bool"), log.data) as [boolean];
      approvals.push({
        token,
        owner,
        spender: operator,
        all: approved,
        standard: "ERC721",
      });
      continue;
    }

    if (t0 === TOPICS.UniswapV2Swap) {
      const [amount0In, amount1In, amount0Out, amount1Out] = decodeAbiParameters(
        parseAbiParameters("uint256, uint256, uint256, uint256"),
        log.data,
      ) as [bigint, bigint, bigint, bigint];
      const recipient = topicToAddress(log.topics[2] as Hex);
      swaps.push({
        pool: log.address,
        protocol: "Uniswap V2",
        recipient,
        amountIn: amount0In > 0n ? amount0In : amount1In,
        amountOut: amount0Out > 0n ? amount0Out : amount1Out,
      });
      continue;
    }

    if (t0 === TOPICS.UniswapV3Swap) {
      const [amount0, amount1] = decodeAbiParameters(
        parseAbiParameters("int256, int256, uint160, uint128, int24"),
        log.data,
      ) as [bigint, bigint, bigint, bigint, number];
      const recipient = topicToAddress(log.topics[2] as Hex);
      const [amountIn, amountOut] =
        amount0 > 0n ? [amount0, -amount1] : [amount1, -amount0];
      swaps.push({
        pool: log.address,
        protocol: "Uniswap V3",
        recipient,
        amountIn,
        amountOut,
      });
      continue;
    }

    if (t0 === TOPICS.SafeApproveHash) {
      safeEvents.push({
        safe: log.address,
        kind: "ApproveHash",
        signer: log.topics[2] ? topicToAddress(log.topics[2] as Hex) : undefined,
        safeTxHash: log.topics[1] as Hex,
      });
      continue;
    }
    if (t0 === TOPICS.SafeSignMsg) {
      safeEvents.push({
        safe: log.address,
        kind: "SignMsg",
        safeTxHash: log.topics[1] as Hex,
      });
      continue;
    }
    if (t0 === TOPICS.SafeExecutionSuccess) {
      safeEvents.push({
        safe: log.address,
        kind: "ExecutionSuccess",
        safeTxHash: log.data ? (log.data.slice(0, 66) as Hex) : undefined,
      });
      continue;
    }
    if (t0 === TOPICS.SafeExecutionFailure) {
      safeEvents.push({
        safe: log.address,
        kind: "ExecutionFailure",
        safeTxHash: log.data ? (log.data.slice(0, 66) as Hex) : undefined,
      });
    }
  }

  const kind = classify({
    transfers,
    approvals,
    swaps,
    safeEvents,
    value: tx.value,
    to: tx.to,
    status: receipt.status,
  });

  const { headline, summary } = describe({
    kind,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    transfers,
    approvals,
    swaps,
    safeEvents,
  });

  return {
    hash,
    kind,
    headline,
    summary,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    blockTimestamp,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.effectiveGasPrice,
    transfers,
    approvals,
    swaps,
    safeEvents,
    raw: { transaction: tx, receipt, logs },
  };
}

function classify(args: {
  transfers: DecodedTransfer[];
  approvals: DecodedApproval[];
  swaps: DecodedSwap[];
  safeEvents: DecodedSafeEvent[];
  value: bigint;
  to: `0x${string}` | null;
  status: "success" | "reverted";
}): TxKind {
  const { transfers, approvals, swaps, safeEvents, value, to, status } = args;

  if (status === "reverted") return "failed";
  if (!to) return "contract-creation";

  if (safeEvents.length > 0) {
    const exec = safeEvents.some((e) => e.kind === "ExecutionSuccess" || e.kind === "ExecutionFailure");
    return exec ? "safe-execution" : "safe-confirmation";
  }

  if (swaps.length > 0) {
    return swaps[0].protocol === "Uniswap V2" ? "uniswap-v2-swap" : "uniswap-v3-swap";
  }

  const erc721Mint = transfers.find(
    (t) => t.tokenId !== undefined && t.from.toLowerCase() === ZERO_ADDR,
  );
  if (erc721Mint && transfers.length === 1) return "erc721-mint";

  const erc721Move = transfers.find((t) => t.tokenId !== undefined);
  if (erc721Move && transfers.length === 1) return "erc721-transfer";

  if (transfers.length === 1 && transfers[0].tokenId === undefined) {
    return "erc20-transfer";
  }

  // Approval-only txs (no token movement) — surface what's being granted.
  if (transfers.length === 0 && approvals.length > 0) {
    return approvals[0].standard === "ERC721" ? "erc721-approval" : "erc20-approval";
  }

  if (transfers.length === 0 && value > 0n) return "eth-transfer";

  return "contract-call";
}

function tokenLabel(t: TokenInfo): string {
  return t.symbol ?? shortAddr(t.address);
}

function transferLine(t: DecodedTransfer): string {
  if (t.tokenId !== undefined) {
    return `${tokenLabel(t.token)} #${t.tokenId.toString()}`;
  }
  const amt = formatAmount(t.amount, t.token.decimals ?? 18);
  return `${amt} ${tokenLabel(t.token)}`;
}

function describe(args: {
  kind: TxKind;
  from: `0x${string}`;
  to: `0x${string}` | null;
  value: bigint;
  transfers: DecodedTransfer[];
  approvals: DecodedApproval[];
  swaps: DecodedSwap[];
  safeEvents: DecodedSafeEvent[];
}): { headline: string; summary: string } {
  const { kind, from, to, value, transfers, approvals, swaps, safeEvents } = args;
  switch (kind) {
    case "eth-transfer":
      return {
        headline: "ETH transfer",
        summary: `${shortAddr(from)} sent ${formatEth(value)} ETH to ${shortAddr(to ?? "0x")}.`,
      };
    case "erc20-transfer": {
      const t = transfers[0];
      return {
        headline: `${tokenLabel(t.token)} transfer`,
        summary: `${shortAddr(t.from)} sent ${transferLine(t)} to ${shortAddr(t.to)}.`,
      };
    }
    case "erc721-mint": {
      const t = transfers[0];
      return {
        headline: `${tokenLabel(t.token)} mint`,
        summary: `${shortAddr(t.to)} minted ${tokenLabel(t.token)} #${t.tokenId?.toString() ?? "?"}.`,
      };
    }
    case "erc721-transfer": {
      const t = transfers[0];
      return {
        headline: `${tokenLabel(t.token)} transfer`,
        summary: `${shortAddr(t.from)} sent ${tokenLabel(t.token)} #${t.tokenId?.toString() ?? "?"} to ${shortAddr(t.to)}.`,
      };
    }
    case "erc20-approval": {
      const a = approvals[0];
      const isUnlimited = a.amount !== undefined && a.amount >= MAX_UINT256;
      const amountStr = isUnlimited
        ? "unlimited"
        : formatAmount(a.amount ?? 0n, a.token.decimals ?? 18);
      const revoked = a.amount === 0n;
      return {
        headline: `${tokenLabel(a.token)} ${revoked ? "approval revoked" : "approval"}`,
        summary: revoked
          ? `${shortAddr(a.owner)} revoked ${shortAddr(a.spender)}'s allowance for ${tokenLabel(a.token)}.`
          : `${shortAddr(a.owner)} approved ${shortAddr(a.spender)} to spend ${amountStr} ${tokenLabel(a.token)}.`,
      };
    }
    case "erc721-approval": {
      const a = approvals[0];
      if (a.all !== undefined) {
        return {
          headline: `${tokenLabel(a.token)} operator approval`,
          summary: a.all
            ? `${shortAddr(a.owner)} approved ${shortAddr(a.spender)} as operator for all ${tokenLabel(a.token)} tokens.`
            : `${shortAddr(a.owner)} revoked ${shortAddr(a.spender)} as operator for ${tokenLabel(a.token)}.`,
        };
      }
      return {
        headline: `${tokenLabel(a.token)} approval`,
        summary: `${shortAddr(a.owner)} approved ${shortAddr(a.spender)} to transfer ${tokenLabel(a.token)} #${a.tokenId?.toString() ?? "?"}.`,
      };
    }
    case "uniswap-v2-swap":
    case "uniswap-v3-swap": {
      const s = swaps[0];
      const inTok = inferSwapToken(transfers, s, "in");
      const outTok = inferSwapToken(transfers, s, "out");
      const inStr = inTok
        ? `${formatAmount(s.amountIn ?? 0n, inTok.token.decimals ?? 18)} ${tokenLabel(inTok.token)}`
        : `${s.amountIn?.toString() ?? "?"}`;
      const outStr = outTok
        ? `${formatAmount(s.amountOut ?? 0n, outTok.token.decimals ?? 18)} ${tokenLabel(outTok.token)}`
        : `${s.amountOut?.toString() ?? "?"}`;
      return {
        headline: `${s.protocol} swap`,
        summary: `${shortAddr(from)} swapped ${inStr} for ${outStr}${swaps.length > 1 ? ` across ${swaps.length} hops` : ""}.`,
      };
    }
    case "safe-confirmation": {
      const ev = safeEvents[0];
      return {
        headline: "Safe transaction approval",
        summary: `${shortAddr(ev.signer ?? from)} approved Safe tx ${shortAddr(ev.safeTxHash ?? "0x")} on Safe ${shortAddr(ev.safe)}.`,
      };
    }
    case "safe-execution": {
      const ev = safeEvents.find((e) => e.kind === "ExecutionSuccess" || e.kind === "ExecutionFailure") ?? safeEvents[0];
      const verb = ev.kind === "ExecutionFailure" ? "failed to execute" : "executed";
      return {
        headline: `Safe ${ev.kind === "ExecutionFailure" ? "execution failure" : "execution"}`,
        summary: `Safe ${shortAddr(ev.safe)} ${verb} tx ${shortAddr(ev.safeTxHash ?? "0x")}.`,
      };
    }
    case "contract-creation":
      return {
        headline: "Contract creation",
        summary: `${shortAddr(from)} deployed a new contract.`,
      };
    case "failed":
      return {
        headline: "Reverted transaction",
        summary: `Tx from ${shortAddr(from)} to ${shortAddr(to ?? "0x")} reverted.`,
      };
    case "contract-call":
    default:
      if (transfers.length > 0) {
        const lines = transfers.slice(0, 3).map(transferLine).join(", ");
        return {
          headline: "Contract interaction",
          summary: `${shortAddr(from)} called ${shortAddr(to ?? "0x")}; transfers: ${lines}${transfers.length > 3 ? "…" : ""}.`,
        };
      }
      return {
        headline: "Contract call",
        summary: `${shortAddr(from)} called ${shortAddr(to ?? "0x")}.`,
      };
  }
}

function inferSwapToken(
  transfers: DecodedTransfer[],
  swap: DecodedSwap,
  side: "in" | "out",
): DecodedTransfer | undefined {
  // Tokens transferred to/from the pool indicate the swap legs.
  const target = swap.pool.toLowerCase();
  if (side === "in") {
    return transfers.find(
      (t) => t.to.toLowerCase() === target && (swap.amountIn ? t.amount === swap.amountIn : true),
    );
  }
  return transfers.find(
    (t) => t.from.toLowerCase() === target && (swap.amountOut ? t.amount === swap.amountOut : true),
  );
}
