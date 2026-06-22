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
    port: 5174,
    allowedHosts: [".trycloudflare.com", ".loca.lt", ".ngrok-free.app"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^@lens\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
      { find: /^@lens\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1") },
    ],
  },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
