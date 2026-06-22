import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { manualChunks } from "../../build/manual-chunks";

const uiSrc = path.resolve(__dirname, "../../packages/ui/src");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    port: 5173,
    allowedHosts: [".trycloudflare.com", ".loca.lt", ".ngrok-free.app"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    // Consume @lens/ui as source. Deep subpaths (e.g. @lens/ui/components/
    // effects/Masonry) let lazy sections code-split effects out of main.
    alias: [
      { find: /^@lens\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
      { find: /^@lens\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1") },
    ],
  },
  build: {
    // The only >500 kB chunk is the lazy, desktop-only Three.js hero
    // (HeroParticles) — code-split into its own chunk and never on the
    // initial path (see root CLAUDE.md §7). Raise the limit above it so the
    // build stays clean, while still flagging anything genuinely runaway.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
