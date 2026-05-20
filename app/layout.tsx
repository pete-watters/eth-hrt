import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETH HRT — Human-Readable Ethereum Transactions",
  description:
    "Paste an Etherscan transaction URL and get a plain-English explanation: ERC20 transfers, swaps, NFT mints, Safe confirmations, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
