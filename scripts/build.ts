import { build } from "https://deno.land/x/dnt/mod.ts";

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./dist",
  shims: {
    deno: true,
  },
  package: {
    name: "davnpsh@nrpp",
    version: Deno.args[0] ?? "1.0.0",
    description: "Non-Recursive Predictive Parser for demonstration",
    license: "GPL-3.0",
  },
  typeCheck: false,
  test: false,
});
