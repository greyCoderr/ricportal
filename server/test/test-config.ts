import type { AppConfig } from "../src/config/app-config.js";

// Rate limiting is off unless a test turns it on explicitly.
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    BODY_LIMIT: "100kb",
    RATE_LIMIT_ENABLED: false,
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 300,
    TRUST_PROXY: 0,
    ...overrides,
  };
}
