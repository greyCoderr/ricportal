import { describe, expect, it } from "vitest";
import { buildPoolConfig } from "./db.js";

// AUD-022 (docs/AUDIT_REPORT.md): a column default such as CURRENT_TIMESTAMP
// must give the same time as the application, which writes UTC.
describe("the session time zone", () => {
  it("every connection starts in UTC (AUD-022)", () => {
    const config = buildPoolConfig({
      host: "h",
      port: 4000,
      user: "u",
      password: "p",
      database: "d",
      tls: false,
    });
    expect(config.initSql).toBe("SET time_zone = '+00:00'");
  });
});
