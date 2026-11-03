import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "shared/{src,test}/**/*.test.ts",
      "server/{src,test}/**/*.test.ts",
      "client/{src,test}/**/*.test.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
