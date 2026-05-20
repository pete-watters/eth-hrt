# eth-hrt

**Human-readable Ethereum transactions.** Paste an Etherscan tx URL (or a raw `0x…` hash) and get a plain-English description of what the transaction actually did — plus the raw data on demand.

On-chain decoding via [viem](https://viem.sh/) and a public RPC. No API keys, no wallet, no accounts.

## What it does

Ethereum transactions are opaque by default: a block explorer shows you `from`, `to`, a `value`, and a blob of calldata like `0x095ea7b3000000…`. Unless you can read 4-byte selectors and event topics in your head, it's impossible to tell a token approval from a swap from an NFT mint.

eth-hrt closes that gap. Give it a transaction and it:

1. Fetches the transaction + receipt + logs from a public RPC.
2. Pattern-matches the event logs against known signatures (ERC20/721 `Transfer`, `Approval`, Uniswap `Swap`, Gnosis Safe events, …).
3. Looks up token metadata (name / symbol / decimals) via a `multicall`.
4. Classifies the transaction into a single type and renders a one-line, plain-English summary — e.g. *"0x867b…14d3 swapped 1.674316 WETH for 3,546.93851 USDT."*
5. Keeps the full raw `transaction + receipt + logs` one click away for anyone who wants to verify.

The home page also ships a table of 12 real mainnet transactions — one per supported type — so you can click through the full decoding range without hunting for hashes.

## Tech choices & why

| Concern | Choice | Why |
| --- | --- | --- |
| Ethereum client | **[viem](https://viem.sh/)** | TypeScript-first, modular, tree-shakeable, fast. It's the modern successor to web3.js (now legacy) and the in-demand alternative to ethers.js for new projects. Used here for RPC reads and ABI/event decoding. |
| Framework | **Next.js 15** (App Router) | A single Server Action (`app/actions.ts`) runs the decode on the server, so the public RPC URL and viem stay server-side and the client just renders the result. |
| Styling | **Panda CSS** + [`@leather.io/panda-preset`](https://www.npmjs.com/package/@leather.io/panda-preset) | Build-time, zero-runtime CSS-in-JS driven by design tokens. The Leather preset supplies the color/spacing system (dark by default). Components are owned in-repo, shadcn-style. |
| Hosting | **Cloudflare Pages** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) | Runs the App Router + Server Actions on the Workers runtime. |

### A note on viem vs. wagmi

These two get listed together on job specs but live at different layers, and it's worth being precise:

- **viem** is the low-level client — RPC calls, encoding/decoding, types. It's what this app uses.
- **wagmi** is a set of **React hooks built on top of viem** (`useAccount`, `useConnect`, `useReadContract`, `useWriteContract`) for *connecting a wallet and sending transactions*.

This app is deliberately **read-only**: it inspects transactions that already happened, with no wallet to connect and nothing to sign. So wagmi has no job to do here — adding it would be decoration, not function. The natural home for wagmi is the **write path**: the pre-execution "explain this before you sign" feature in the roadmap below, where a connected wallet and `useSimulateContract` / `useWriteContract` genuinely earn their place.

In short: **read path → viem, write path → wagmi.**

## Decoding coverage (MVP)

| Tx type | Detection |
| --- | --- |
| Native ETH transfer | `to != null`, `value > 0`, no logs |
| ERC20 transfer | 3-topic `Transfer(address,address,uint256)` |
| ERC20 approval | `Approval(address,address,uint256)` — detects unlimited (`MAX_UINT256`) and revokes (`0`) |
| ERC721 mint | 4-topic `Transfer` with `from = 0x0` |
| ERC721 transfer | 4-topic `Transfer` |
| ERC721 approval | 4-topic `Approval` (single token) / `ApprovalForAll` (operator) |
| Uniswap V2 swap | `Swap(address,uint256,uint256,uint256,uint256,address)` |
| Uniswap V3 swap | `Swap(address,address,int256,int256,uint160,uint128,int24)` |
| Safe confirmation | Gnosis Safe `ApproveHash` / `SignMsg` event |
| Safe execution | Gnosis Safe `ExecutionSuccess` / `ExecutionFailure` |
| Contract creation | `to == null` |
| Reverted | `receipt.status === "reverted"` |

Anything that doesn't match falls back to a generic "contract interaction" summary that still lists every token transfer and approval extracted from the logs — so even an unrecognized DeFi call shows you what moved.

## Local development

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

By default the app talks to `https://ethereum-rpc.publicnode.com`. Public RPCs can be flaky; override with a faster/dedicated endpoint in `.env.local`:

```sh
NEXT_PUBLIC_ETH_RPC_URL=https://eth.drpc.org
```

Sanity-check the decoder without the UI (runs against the 12 sample txs):

```sh
pnpm smoke
```

## Deploy to Cloudflare

This deploys as a **Cloudflare Worker** (via `@opennextjs/cloudflare` — note `wrangler.jsonc`), not the legacy Pages product.

### CI: Cloudflare Workers Builds (deploy on push)

Connect the repo in the Cloudflare dashboard (*Workers → Create → Connect to Git*) and set:

- **Build command:** `pnpm run cf:build`
- **Deploy command:** `pnpm run cf:deploy`

Both use the locally-installed `@opennextjs/cloudflare` bin via pnpm script PATH resolution — don't use `pnpm dlx`, which fetches a differently-named package and fails with `ERR_PNPM_DLX_NO_BIN`.

### Manual deploy from your machine

```sh
pnpm dlx wrangler login   # one-time
pnpm deploy               # build + deploy
```

Local preview of the production worker bundle: `pnpm preview`.

## Project layout

```
app/
  actions.ts        Server Action: parse input → decode → serialize
  page.tsx          Home page (hero + sample table)
components/
  hero.tsx          Input, decode flow, result + sample table wiring
  tx-result.tsx     Decoded result card + raw-data reveal
  sample-table.tsx  Clickable table of sample transactions
  ui/               shadcn-style Button / Input / Card (Panda-styled)
lib/
  viem.ts           Public RPC client
  parse-input.ts    Etherscan URL / hash → tx hash
  sample-txs.ts     12 real mainnet txs for one-click testing
  serialize.ts      BigInt-safe JSON for the server→client boundary
  decoder/
    index.ts        Orchestration: fetch, match logs, classify, describe
    topics.ts       Pre-computed event signature hashes
    erc20-meta.ts   Token metadata via multicall (cached)
    format.ts       Address / amount / gwei / eth formatting
    types.ts        Decoded shapes
panda.config.ts     Panda + Leather preset
```

## Roadmap

- **Pre-execution simulation** — explain a transaction *before* it's signed (the highest-value next feature; this is where a connected wallet + wagmi come in).
- **Multi-chain** — Stacks, Bitcoin, Solana. Each is a separate decoder adapter (different RPC + data model), so it belongs in the larger product rather than this single-chain case study.
- **ENS resolution** for `from` / `to` addresses.
- **More protocols** — liquidity add/remove, staking, lending (Aave/Compound) heuristics.
