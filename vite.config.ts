import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Tauri: prevent vite from obscuring Rust errors
  clearScreen: false,

  server: {
    port: 5173,
    // Tauri expects a fixed port; fail if unavailable
    strictPort: true,
    watch: {
      // Ignore src-tauri to avoid unnecessary reloads
      ignored: ["**/src-tauri/**"],
    },
  },

  // Env variables — expose VITE_ and TAURI_ prefixes to the app
  envPrefix: ["VITE_", "TAURI_"],

  build: {
    // Tauri supports ES2021 / Chrome 91+
    target: ["es2021", "chrome97", "safari13"],
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
