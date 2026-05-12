import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Allow importing the shared types from ../world and the JSON fixtures from ../fixtures.
    fs: { allow: [".."] },
  },
});
