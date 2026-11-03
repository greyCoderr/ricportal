import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Three groups (DEC-019, DEC-021):
// - unit: shared and server, no database.
// - db: real ricportal_test database. The global setup checks the guard and
//   runs `prisma migrate deploy`; files run one at a time.
// - client: React tests in jsdom with Testing Library.
const DB_TESTS = "server/test/db/**/*.test.ts";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "shared/{src,test}/**/*.test.ts",
            "server/{src,test}/**/*.test.ts",
          ],
          exclude: ["**/node_modules/**", "**/dist/**", DB_TESTS],
        },
      },
      {
        test: {
          name: "db",
          include: [DB_TESTS],
          exclude: ["**/node_modules/**", "**/dist/**"],
          globalSetup: ["server/test/db/global-setup.ts"],
          fileParallelism: false,
          testTimeout: 15_000,
          hookTimeout: 60_000,
        },
      },
      {
        plugins: [react()],
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/{src,test}/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**"],
          setupFiles: ["client/test/setup.ts"],
        },
      },
    ],
  },
});
