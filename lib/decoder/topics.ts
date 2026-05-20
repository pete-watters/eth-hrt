// Pre-computed keccak256 event signatures for fast log matching.
export const TOPICS = {
  // ERC20 / ERC721
  Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  Approval: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
  ApprovalForAll: "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",

  // Uniswap V2: Swap(address,uint256,uint256,uint256,uint256,address)
  UniswapV2Swap: "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
  // Uniswap V3: Swap(address,address,int256,int256,uint160,uint128,int24)
  UniswapV3Swap: "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",

  // Gnosis Safe
  SafeApproveHash: "0xf2a0eb156472d1440255b0d7c1e19cc07115d1051fe605b0dce69acfec884d9c",
  SafeSignMsg: "0xe7f4675038f4f6034dfcbbb24c4dc08e4ebf10eb9d257d3d02c0f38d122ac6e4",
  SafeExecutionSuccess: "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e",
  SafeExecutionFailure: "0x23428b18acfb3ea64b08dc0c1d296ea9c09702c09083ca5272e64d115b687d23",
} as const;
