import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const resolve =
    mode === "production"
      ? {
          alias: {
            "/workers/": "/node_modules/@tedengine/ted/workers/",
          },
        }
      : undefined;

  return {
    define: {
      global: {},
    },
    assetsInclude: ["**/*.obj", "**/*.mtl"],
    resolve,
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: "./node_modules/@tedengine/ted/workers",
            dest: "./public",
          },
        ],
      }),
    ],
    optimizeDeps: {
      exclude: ["@tedengine/ted"],
    },
    worker: {
      format: "es",
    },
  };
});
