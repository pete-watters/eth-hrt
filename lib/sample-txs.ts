// Real mainnet txs covering the decoder's supported types, for one-click testing.
// `method` / `selector` describe the raw calldata; `note` describes what it does.
export interface SampleTx {
  label: string;
  hash: `0x${string}`;
  selector: string;
  method: string;
  note: string;
}

export const SAMPLE_TXS: SampleTx[] = [
  {
    label: "Uniswap V3 swap",
    hash: "0x33710b450fee196d5b020a64f6fdbd1b57ac7536366b4fc209ca22e9ad08e065",
    selector: "0x5ae401dc",
    method: "multicall(uint256,bytes[])",
    note: "WETH → MATIC via SwapRouter02",
  },
  {
    label: "Uniswap V2 swap",
    hash: "0xe4e1e0eb402d60c1e63246ecb7d86fa6f61c307e0432429d219049d40634f684",
    selector: "0x38ed1739",
    method: "swapExactTokensForTokens(...)",
    note: "USDT → FB via V2 router",
  },
  {
    label: "Native ETH send",
    hash: "0x70d747fc0d6f07bf9b4bfb028a6db4d466e9428310f24ee2df4d8754febe961e",
    selector: "0x",
    method: "(no calldata)",
    note: "0.49 ETH wallet-to-wallet",
  },
  {
    label: "ERC721 transfer",
    hash: "0x98fef92cee465d1b77c37267805dbc02a78119e627e6c7feb93bc0809f471254",
    selector: "0x23b872dd",
    method: "transferFrom(address,address,uint256)",
    note: "KBA NFT #4387",
  },
  {
    label: "NFT mint",
    hash: "0xfa26988f752e18644310bf2e432cd12af007510c218fb8e4d99668b161a145d3",
    selector: "0x2e4dbe8f",
    method: "claim(...)",
    note: "Galxe ETH Merge OAT",
  },
  {
    label: "Contract creation",
    hash: "0xf9c41380331c73f8766ba0afa64f940c95e72a96c25922943275300183e3e14f",
    selector: "0x60806040",
    method: "(deploy bytecode)",
    note: "Minimal proxy deploy",
  },
  {
    label: "Multi-hop swap",
    hash: "0x7efa4cfeea06b544a30dae0132085825047ad8f9f7cfa756463ab325073fee81",
    selector: "0x5ae401dc",
    method: "multicall(uint256,bytes[])",
    note: "3-hop swap → WETH",
  },
  {
    label: "Aave deposit",
    hash: "0xa981731317c95b80c6b26c00f34071cacbfdbddf1ab9731d1ebe9d8a5f916339",
    selector: "0xe8eda9df",
    method: "deposit(address,uint256,address,uint16)",
    note: "Supply UNI-V2 LP to Aave",
  },
  {
    label: "Aave withdraw",
    hash: "0xe614e025da19e1eede290731cf4bba2acafd8550c51512bffe4a5c2d4cba21d3",
    selector: "0x69328dec",
    method: "withdraw(address,uint256,address)",
    note: "Redeem aToken position",
  },
  {
    label: "ERC20 approve",
    hash: "0x769474065b9f9a9a45f8483b09333b2530795ff985b15ae7c84ad24e709014a0",
    selector: "0x095ea7b3",
    method: "approve(address,uint256)",
    note: "LINK allowance (no Transfer log)",
  },
  {
    label: "ERC721 approve-all",
    hash: "0x674b6752c0c1b4948666fcc25ea3dfe84b9b3c1e1b8a8d7afe44890c338b70b9",
    selector: "0xa22cb465",
    method: "setApprovalForAll(address,bool)",
    note: "Operator approval",
  },
  {
    label: "Add liquidity",
    hash: "0x3bfcb4ff41d77538fd066fcd852be855d458d6b4195aebb7667792af51c7f3e1",
    selector: "0xac9650d8",
    method: "multicall(bytes[])",
    note: "USDC + WETH → V3 position NFT",
  },
];
