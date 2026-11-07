import type { AppConfig } from "../src/config/app-config.js";

// Fake, tests only. Not the development default, so a test cannot pass by accident.
export const TEST_DEFAULT_PASSWORD = "TestDefault2026";

// Rate limiting is off unless a test turns it on explicitly.
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    BODY_LIMIT: "100kb",
    RATE_LIMIT_ENABLED: false,
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 300,
    TRUST_PROXY: 0,
    JWT_SECRET: "test-only-secret-test-only-secret-123456",
    COOKIE_SECURE: false,
    SESSION_HOURS: 8,
    BCRYPT_COST: 4,
    DEFAULT_PASSWORD: TEST_DEFAULT_PASSWORD,
    ...overrides,
  };
}
