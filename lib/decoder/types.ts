import type { Hex, TransactionReceipt, Transaction, Log } from "viem";

export type TxKind =
  | "eth-transfer"
  | "erc20-transfer"
  | "erc20-approval"
  | "erc721-approval"
  | "erc721-mint"
  | "erc721-transfer"
  | "uniswap-v2-swap"
  | "uniswap-v3-swap"
  | "safe-confirmation"
  | "safe-execution"
  | "contract-creation"
  | "contract-call"
  | "failed";

export interface TokenInfo {
  address: `0x${string}`;
  name?: string;
  symbol?: string;
  decimals?: number;
}

export interface DecodedTransfer {
  token: TokenInfo;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
  tokenId?: bigint;
}

export interface DecodedSwap {
  pool: `0x${string}`;
  protocol: "Uniswap V2" | "Uniswap V3";
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  amountIn?: bigint;
  amountOut?: bigint;
  recipient: `0x${string}`;
}

export interface DecodedApproval {
  token: TokenInfo;
  owner: `0x${string}`;
  spender: `0x${string}`;
  // ERC20: amount approved. ERC721: a single tokenId. ApprovalForAll: undefined + all=true.
  amount?: bigint;
  tokenId?: bigint;
  all?: boolean;
  standard: "ERC20" | "ERC721";
}

export interface DecodedSafeEvent {
  safe: `0x${string}`;
  signer?: `0x${string}`;
  safeTxHash?: Hex;
  kind: "ApproveHash" | "SignMsg" | "ExecutionSuccess" | "ExecutionFailure";
}

export interface DecodedTx {
  hash: `0x${string}`;
  kind: TxKind;
  headline: string;
  summary: string;
  from: `0x${string}`;
  to: `0x${string}` | null;
  value: bigint;
  status: "success" | "reverted";
  blockNumber: bigint;
  blockTimestamp?: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  transfers: DecodedTransfer[];
  approvals: DecodedApproval[];
  swaps: DecodedSwap[];
  safeEvents: DecodedSafeEvent[];
  raw: {
    transaction: Transaction;
    receipt: TransactionReceipt;
    logs: Log[];
  };
}
