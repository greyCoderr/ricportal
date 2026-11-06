import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const serverEntry = fileURLToPath(new URL("../src/server.ts", import.meta.url));

describe("server startup", () => {
  it("exits with code 1 and a readable message when env is invalid, without printing values", () => {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.DATABASE_URL;
    delete env.NODE_ENV;
    delete env.LOG_LEVEL;
    env.PORT = "secret-value-123";

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", serverEntry],
      {
        env,
        encoding: "utf8",
        timeout: 30_000,
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid environment configuration");
    expect(result.stderr).toContain("DATABASE_URL is missing");
    expect(result.stderr).toContain(
      "PORT must be a whole number from 1 to 65535",
    );
    expect(result.stderr).not.toContain("secret-value-123");
    expect(result.stdout).not.toContain("secret-value-123");
    // tsx startup is slow on the Developer's machine, so only this test gets
    // 15 seconds (DEC-027).
  }, 30_000);
});
