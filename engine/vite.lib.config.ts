import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Library build. Produces a single IIFE bundle that exposes
// `window.TileJumper = { Game, Bridge, preloadAssets }` so consumers
// (e.g. demo/) can integrate with one <script> tag.
//
// Output: engine/lib/engine.iife.js
// Run:    npm run build:lib

const here = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    outDir: resolve(here, "lib"),
    emptyOutDir: true,
    target: "es2020",
    lib: {
      entry: resolve(here, "src/index.ts"),
      name: "TileJumper",
      formats: ["iife"],
      fileName: () => "engine.iife.js",
    },
    rollupOptions: {
      output: {
        extend: true,  // attach to existing window.TileJumper if present
      },
    },
    sourcemap: true,
  },
  server: {
    fs: { allow: [".."] },
  },
});
