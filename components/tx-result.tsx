"use client";

import { useState } from "react";
import { css } from "@/styled-system/css";
import { flex, grid, stack } from "@/styled-system/patterns";
import { Card } from "./ui/card";

export interface SerializedDecodedTx {
  hash: string;
  kind: string;
  headline: string;
  summary: string;
  from: string;
  to: string | null;
  value: string;
  status: "success" | "reverted";
  blockNumber: string;
  blockTimestamp?: string;
  gasUsed: string;
  effectiveGasPrice: string;
  transfers: {
    token: { address: string; name?: string; symbol?: string; decimals?: number };
    from: string;
    to: string;
    amount: string;
    tokenId?: string;
  }[];
  approvals: {
    token: { address: string; name?: string; symbol?: string; decimals?: number };
    owner: string;
    spender: string;
    amount?: string;
    tokenId?: string;
    all?: boolean;
    standard: "ERC20" | "ERC721";
  }[];
  swaps: unknown[];
  safeEvents: unknown[];
  raw: unknown;
}

const MAX_UINT256_STR =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

function shortAddr(addr: string) {
  if (!addr || !addr.startsWith("0x")) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtAmount(value: string, decimals = 18, maxFrac = 6): string {
  const negative = value.startsWith("-");
  const abs = negative ? value.slice(1) : value;
  if (abs === "0") return "0";
  const pad = abs.padStart(decimals + 1, "0");
  const whole = pad.slice(0, pad.length - decimals);
  const frac = pad.slice(pad.length - decimals).slice(0, maxFrac).replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

export function TxResult({ data }: { data: SerializedDecodedTx }) {
  const [rawOpen, setRawOpen] = useState(false);
  const gasEth = fmtAmount((BigInt(data.gasUsed) * BigInt(data.effectiveGasPrice)).toString(), 18, 6);
  const timestamp = data.blockTimestamp
    ? new Date(Number(BigInt(data.blockTimestamp)) * 1000).toUTCString()
    : null;

  return (
    <div className={stack({ gap: "5" })}>
      <Card>
        <div className={flex({ gap: "3", align: "center", justify: "space-between", wrap: "wrap" })}>
          <span className={kindBadge}>{data.kind.replace(/-/g, " ")}</span>
          <span className={statusStyle(data.status)}>{data.status}</span>
        </div>
        <h2 className={headlineStyle}>{data.headline}</h2>
        <p className={summaryStyle}>{data.summary}</p>

        <div className={grid({ columns: { base: 1, md: 2 }, gap: "4", mt: "6" })}>
          <Field label="From" value={data.from} mono />
          <Field label="To" value={data.to ?? "(contract creation)"} mono />
          <Field label="Block" value={Number(data.blockNumber).toLocaleString()} />
          <Field label="Gas cost" value={`${gasEth} ETH`} />
          {timestamp && <Field label="When" value={timestamp} />}
          <Field label="Value sent" value={`${fmtAmount(data.value, 18)} ETH`} />
        </div>
      </Card>

      {data.transfers.length > 0 && (
        <Card>
          <h3 className={sectionTitle}>Token transfers</h3>
          <ul className={transfersList}>
            {data.transfers.map((t, i) => (
              <li key={i} className={transferRow}>
                <span className={transferAmount}>
                  {t.tokenId !== undefined
                    ? `#${t.tokenId}`
                    : fmtAmount(t.amount, t.token.decimals ?? 18)}
                </span>
                <span className={transferToken}>
                  {t.token.symbol ?? shortAddr(t.token.address)}
                </span>
                <span className={transferArrow}>
                  {shortAddr(t.from)} → {shortAddr(t.to)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.approvals.length > 0 && (
        <Card>
          <h3 className={sectionTitle}>Approvals granted</h3>
          <ul className={transfersList}>
            {data.approvals.map((a, i) => {
              const sym = a.token.symbol ?? shortAddr(a.token.address);
              let detail: string;
              if (a.all !== undefined) {
                detail = a.all ? "all tokens (operator)" : "operator revoked";
              } else if (a.tokenId !== undefined) {
                detail = `#${a.tokenId}`;
              } else if (a.amount === MAX_UINT256_STR) {
                detail = "unlimited";
              } else if (a.amount === "0") {
                detail = "revoked";
              } else {
                detail = fmtAmount(a.amount ?? "0", a.token.decimals ?? 18);
              }
              return (
                <li key={i} className={transferRow}>
                  <span className={transferAmount}>{detail}</span>
                  <span className={transferToken}>{sym}</span>
                  <span className={transferArrow}>
                    {shortAddr(a.owner)} → spender {shortAddr(a.spender)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <details
        className={detailsStyle}
        open={rawOpen}
        onToggle={(e) => setRawOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className={summaryToggle}>
          {rawOpen ? "Hide" : "Reveal"} raw transaction data
        </summary>
        <pre className={preStyle}>{JSON.stringify(data.raw, null, 2)}</pre>
      </details>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={fieldStyle}>
      <div className={fieldLabel}>{label}</div>
      <div className={mono ? fieldValueMono : fieldValue}>{value}</div>
    </div>
  );
}

const kindBadge = css({
  display: "inline-flex",
  alignItems: "center",
  px: "3",
  py: "1",
  borderRadius: "round",
  fontSize: "xs",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  background: "blue.background-primary",
  color: "blue.text-primary",
});

const statusStyle = (status: "success" | "reverted") =>
  css({
    fontSize: "xs",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: status === "success" ? "green.text-primary" : "red.text-primary",
    background: status === "success" ? "green.background-primary" : "red.background-primary",
    px: "3",
    py: "1",
    borderRadius: "round",
  });

const headlineStyle = css({
  fontSize: "3xl",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: 0,
  mt: "5",
  color: "ink.text-primary",
});

const summaryStyle = css({
  fontSize: "md",
  lineHeight: "1.6",
  color: "ink.text-subdued",
  margin: 0,
  mt: "3",
});

const sectionTitle = css({
  fontSize: "lg",
  fontWeight: 600,
  margin: 0,
  mb: "4",
  color: "ink.text-primary",
});

const transfersList = css({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const transferRow = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr 1fr", md: "auto auto 1fr" },
  gap: "4",
  alignItems: "center",
  fontSize: "sm",
  py: "3",
  borderBottom: "1px solid",
  borderColor: "ink.border-default",
  _last: { borderBottom: "none" },
});

const transferAmount = css({
  fontWeight: 600,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "ink.text-primary",
});

const transferToken = css({ color: "blue.action-primary-default", fontWeight: 500 });

const transferArrow = css({
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "ink.text-subdued",
  fontSize: "xs",
});

const fieldStyle = css({});
const fieldLabel = css({
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "ink.text-non-interactive",
  mb: "1",
});
const fieldValue = css({ fontSize: "sm", color: "ink.text-primary" });
const fieldValueMono = css({
  fontSize: "sm",
  color: "ink.text-primary",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  wordBreak: "break-all",
});

const detailsStyle = css({
  background: "ink.background-secondary",
  border: "1px solid",
  borderColor: "ink.border-default",
  borderRadius: "lg",
  px: "6",
  py: "4",
});

const summaryToggle = css({
  cursor: "pointer",
  fontSize: "sm",
  color: "ink.text-subdued",
  userSelect: "none",
  _hover: { color: "ink.text-primary" },
});

const preStyle = css({
  fontSize: "xs",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  overflow: "auto",
  maxHeight: "480px",
  mt: "4",
  p: "4",
  background: "ink.component-background-default",
  borderRadius: "md",
  color: "ink.text-subdued",
});
