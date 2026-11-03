import { defineConfig } from "vitest/config";

// Two groups (DEC-019):
// - unit: no database.
// - db: real ricportal_test database. The global setup checks the guard and
//   runs `prisma migrate deploy`; files run one at a time.
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
            "client/{src,test}/**/*.test.{ts,tsx}",
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
    ],
  },
});
