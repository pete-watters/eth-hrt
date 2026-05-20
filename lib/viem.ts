import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const RPC_URL =
  process.env.NEXT_PUBLIC_ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";

export const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL, { batch: true }),
});
