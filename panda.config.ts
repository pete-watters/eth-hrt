import { defineConfig } from "@pandacss/dev";
import leatherPreset from "@leather.io/panda-preset";

export default defineConfig({
  preflight: true,
  presets: ["@pandacss/dev/presets", leatherPreset],
  include: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  exclude: [],
  jsxFramework: "react",
  outdir: "styled-system",
});
