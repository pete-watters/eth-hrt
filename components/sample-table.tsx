"use client";

import { css } from "@/styled-system/css";
import { SAMPLE_TXS } from "@/lib/sample-txs";

export function SampleTable({ onPick }: { onPick: (hash: string) => void }) {
  return (
    <div className={wrapStyle}>
      <div className={headerRow}>
        <h2 className={titleStyle}>Sample transactions</h2>
        <p className={subStyle}>Real mainnet txs — click any row to decode it.</p>
      </div>
      <div className={tableScroll}>
        <table className={tableStyle}>
          <thead>
            <tr>
              <th className={th}>Type</th>
              <th className={th}>Method</th>
              <th className={thSelector}>Selector</th>
              <th className={th}>What it does</th>
              <th className={thHash}>Tx hash</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TXS.map((tx) => (
              <tr
                key={tx.hash}
                className={row}
                onClick={() => onPick(tx.hash)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(tx.hash);
                  }
                }}
              >
                <td className={tdLabel}>{tx.label}</td>
                <td className={tdMono}>{tx.method}</td>
                <td className={tdSelector}>{tx.selector}</td>
                <td className={tdNote}>{tx.note}</td>
                <td className={tdHash}>
                  {tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const wrapStyle = css({ width: "100%", maxWidth: "960px" });

const headerRow = css({ mb: "5", textAlign: "center" });

const titleStyle = css({
  fontSize: "xl",
  fontWeight: 600,
  color: "ink.text-primary",
  margin: 0,
});

const subStyle = css({
  fontSize: "sm",
  color: "ink.text-subdued",
  margin: 0,
  mt: "1",
});

const tableScroll = css({
  overflowX: "auto",
  border: "1px solid",
  borderColor: "ink.border-default",
  borderRadius: "lg",
  background: "ink.background-secondary",
});

const tableStyle = css({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "sm",
  minWidth: "720px",
});

const th = css({
  textAlign: "left",
  fontSize: "2xs",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "ink.text-non-interactive",
  fontWeight: 500,
  px: "4",
  py: "3",
  borderBottom: "1px solid",
  borderColor: "ink.border-default",
});

const thSelector = css({
  textAlign: "left",
  fontSize: "2xs",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "ink.text-non-interactive",
  fontWeight: 500,
  px: "4",
  py: "3",
  borderBottom: "1px solid",
  borderColor: "ink.border-default",
  whiteSpace: "nowrap",
});

const thHash = thSelector;

const row = css({
  cursor: "pointer",
  transition: "background 100ms ease",
  _hover: { background: "ink.component-background-hover" },
  _focusVisible: { outline: "2px solid", outlineColor: "blue.action-primary-default", outlineOffset: "-2px" },
  borderBottom: "1px solid",
  borderColor: "ink.border-transparent",
});

const tdBase = {
  px: "4",
  py: "3",
  verticalAlign: "middle" as const,
};

const tdLabel = css({ ...tdBase, fontWeight: 600, color: "blue.action-primary-default", whiteSpace: "nowrap" });
const tdMono = css({
  ...tdBase,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "xs",
  color: "ink.text-primary",
  whiteSpace: "nowrap",
});
const tdSelector = css({
  ...tdBase,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "xs",
  color: "ink.text-subdued",
});
const tdNote = css({ ...tdBase, color: "ink.text-subdued" });
const tdHash = css({
  ...tdBase,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "xs",
  color: "ink.text-non-interactive",
  whiteSpace: "nowrap",
});
