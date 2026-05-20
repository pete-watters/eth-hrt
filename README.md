# eth-hrt

**Human-readable Ethereum transactions.** Paste an Etherscan tx URL, get a plain-English description of what happened — ERC20 transfers, Uniswap V2/V3 swaps, NFT mints, Safe confirmations — plus the raw data on demand.

On-chain decoding via [viem](https://viem.sh/) and a public RPC — no API keys, no accounts.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **Panda CSS** + [`@leather.io/panda-preset`](https://www.npmjs.com/package/@leather.io/panda-preset) for design tokens
- **viem** for RPC and ABI decoding
- **Cloudflare Pages** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)

## Local development

```sh
pnpm install
pnpm dev
```

The dev server runs at <http://localhost:3000>. By default the app talks to `https://ethereum-rpc.publicnode.com`; override with `NEXT_PUBLIC_ETH_RPC_URL` in `.env.local` if you have a faster RPC.

## Decoding coverage (MVP)

| Tx type | Detection |
| --- | --- |
| Native ETH transfer | `to != null`, `value > 0`, no logs |
| ERC20 transfer | 3-topic `Transfer(address,address,uint256)` |
| ERC721 mint | 4-topic `Transfer` with `from = 0x0` |
| ERC721 transfer | 4-topic `Transfer` |
| Uniswap V2 swap | `Swap(address,uint256,uint256,uint256,uint256,address)` |
| Uniswap V3 swap | `Swap(address,address,int256,int256,uint160,uint128,int24)` |
| Safe confirmation | Gnosis Safe `ApproveHash` / `SignMsg` event |
| Safe execution | Gnosis Safe `ExecutionSuccess` / `ExecutionFailure` |
| Contract creation | `to == null` |
| Reverted | `receipt.status === "reverted"` |

Anything that doesn't match falls back to a generic "contract interaction" summary that still lists every token transfer extracted from the logs.

## Deploy to Cloudflare Pages

```sh
pnpm deploy
```

That runs `opennextjs-cloudflare build` (produces `.open-next/`) followed by `opennextjs-cloudflare deploy`. First-time setup:

1. `pnpm dlx wrangler login`
2. `pnpm cf-typegen` to generate `cloudflare-env.d.ts`
3. `pnpm deploy`

For a local preview of the production worker bundle: `pnpm preview`.

## Layout

```
app/            Next.js App Router (page, layout, server action)
components/     Hero, result card, raw-data reveal, shadcn-style primitives
lib/
  viem.ts       Public client
  parse-input.ts  Etherscan URL → tx hash
  decoder/      Topic matching, ERC20 metadata, plain-English summary
  serialize.ts  BigInt-safe JSON for server→client boundary
panda.config.ts Panda + Leather preset
```

## Roadmap

- Multi-chain (Stacks, Bitcoin, Solana) — V1 covered Ethereum + L2s
- ENS resolution for `from` / `to`
- Liquidity add/remove, staking heuristics from V1
- Local pinning of RPC URL via settings
