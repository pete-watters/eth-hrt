"use client";

import { useState, useTransition } from "react";
import { css } from "@/styled-system/css";
import { flex, stack } from "@/styled-system/patterns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { TxResult, type SerializedDecodedTx } from "./tx-result";
import { SampleTable } from "./sample-table";
import { decodeAction } from "@/app/actions";

export function Hero() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<SerializedDecodedTx | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (input: string) => {
    setError(null);
    startTransition(async () => {
      const res = await decodeAction(input);
      if (res.ok) {
        setResult(res.data as unknown as SerializedDecodedTx);
      } else {
        setError(res.error);
        setResult(null);
      }
    });
  };

  const pickSample = (hash: string) => {
    setValue(hash);
    submit(hash);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={mainStyle}>
      <section className={heroStyle}>
        <p className={eyebrowStyle}>eth · human-readable transactions</p>
        <h1 className={titleStyle}>
          Paste an Ethereum transaction.
          <br />
          <span className={titleAccent}>Read it like English.</span>
        </h1>
        <p className={subStyle}>
          ERC20 transfers, Uniswap swaps, NFT mints, Safe confirmations — all decoded from a public
          RPC. No accounts, no API keys.
        </p>

        <form
          className={formStyle}
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) submit(value);
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://etherscan.io/tx/0x… or 0x…"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            aria-label="Etherscan transaction URL or hash"
          />
          <Button type="submit" disabled={pending || value.trim().length === 0}>
            {pending ? "Decoding…" : "Decode"}
          </Button>
        </form>

        {error && <div className={errorStyle}>{error}</div>}
      </section>

      {result && (
        <section className={resultWrapStyle}>
          <TxResult data={result} />
        </section>
      )}

      <SampleTable onPick={pickSample} />
    </main>
  );
}

const mainStyle = css({
  minH: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  px: "5",
  py: "16",
  gap: "16",
});

const heroStyle = stack({
  gap: "8",
  align: "center",
  textAlign: "center",
  maxWidth: "780px",
  width: "100%",
});

const eyebrowStyle = css({
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "ink.text-non-interactive",
  margin: 0,
});

const titleStyle = css({
  fontSize: { base: "4xl", md: "6xl" },
  lineHeight: "1.05",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "ink.text-primary",
  margin: 0,
});

const titleAccent = css({
  color: "blue.action-primary-default",
});

const subStyle = css({
  fontSize: "md",
  lineHeight: "1.6",
  color: "ink.text-subdued",
  maxWidth: "560px",
  margin: 0,
});

const formStyle = flex({
  gap: "3",
  width: "100%",
  maxWidth: "640px",
  direction: { base: "column", md: "row" },
});

const errorStyle = css({
  color: "red.text-primary",
  background: "red.background-primary",
  border: "1px solid",
  borderColor: "red.border",
  borderRadius: "md",
  px: "5",
  py: "3",
  fontSize: "sm",
});

const resultWrapStyle = css({
  width: "100%",
  maxWidth: "880px",
});
