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
    babel({
      presets: [reactCompilerPreset()],
      // The ReUI Data Grid (@lens/ui .../reui) builds on TanStack Table's
      // mutable instance state; the React Compiler's auto-memoization freezes
      // its rows on sort/pagination. Skip the compiler for it (the react()
      // plugin still transforms its JSX). Consumers that hold the table
      // instance also opt out via "use no memo" (routes + DataTable).
      exclude: [/[\\/]node_modules[\\/]/, /[\\/]reui[\\/]/],
    }),
  ],
  server: {
    port: 5175,
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
