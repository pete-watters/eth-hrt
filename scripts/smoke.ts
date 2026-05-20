import { decodeTx } from "../lib/decoder/index";
import { SAMPLE_TXS } from "../lib/sample-txs";

async function main() {
  for (const sample of SAMPLE_TXS) {
    try {
      const d = await decodeTx(sample.hash);
      console.log(`${sample.label.padEnd(20)} → ${d.kind.padEnd(20)} ${d.summary}`);
    } catch (e) {
      console.log(`${sample.label.padEnd(20)} → FAILED ${(e as Error).message}`);
    }
  }
}

main();
