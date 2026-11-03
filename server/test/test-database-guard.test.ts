import { describe, expect, it } from "vitest";
import {
  assertSafeTestDatabase,
  assertTestDatabaseName,
  TestDatabaseError,
} from "./db/test-database.js";

const LOCAL = "mysql://root@127.0.0.1:3306/ricportal_test";

function errorFrom(run: () => unknown): TestDatabaseError {
  try {
    run();
  } catch (error) {
    if (error instanceof TestDatabaseError) {
      return error;
    }
    throw error;
  }
  throw new Error("the guard did not throw");
}

describe("assertSafeTestDatabase", () => {
  it("accepts the local ricportal_test database when NODE_ENV is test", () => {
    expect(assertSafeTestDatabase(LOCAL, "test").database).toBe(
      "ricportal_test",
    );
  });

  it.each([
    "mysql://root@localhost:3306/ricportal_test",
    "mysql://root@[::1]:3306/ricportal_test",
  ])("accepts the local host in %s", (url) => {
    expect(assertSafeTestDatabase(url, "test").database).toBe("ricportal_test");
  });

  it("refuses the dev database", () => {
    expect(
      errorFrom(() =>
        assertSafeTestDatabase("mysql://root@127.0.0.1:3306/ricportal", "test"),
      ).message,
    ).toBe("Test database name must end with _test");
  });

  it.each([undefined, "", "development", "production"])(
    "refuses when NODE_ENV is %s",
    (nodeEnv) => {
      expect(
        errorFrom(() => assertSafeTestDatabase(LOCAL, nodeEnv)).message,
      ).toBe("Database tests need NODE_ENV=test");
    },
  );

  it("refuses a remote host such as TiDB, without showing the URL", () => {
    const url =
      "mysql://4abc.root:s3cret-pw@gateway01.example.tidbcloud.com:4000/ricportal_test?sslaccept=strict";
    const error = errorFrom(() => assertSafeTestDatabase(url, "test"));
    expect(error.message).toBe(
      "Test database must be on this machine (127.0.0.1, localhost or ::1)",
    );
    const shown = `${error.message}\n${error.stack ?? ""}`;
    expect(shown).not.toContain("s3cret-pw");
    expect(shown).not.toContain("tidbcloud");
    expect(shown).not.toContain("4abc.root");
  });

  it("refuses a missing DATABASE_URL", () => {
    expect(
      errorFrom(() => assertSafeTestDatabase(undefined, "test")).message,
    ).toBe(
      "DATABASE_URL for tests is missing (create .env.test from .env.test.example)",
    );
  });

  it("refuses an invalid URL with a fixed message", () => {
    const error = errorFrom(() =>
      assertSafeTestDatabase("not a url s3cret-pw", "test"),
    );
    expect(error.message).toBe("DATABASE_URL for tests is not valid");
    expect(error.message).not.toContain("s3cret-pw");
  });
});

describe("assertTestDatabaseName", () => {
  it("accepts a name ending with _test", () => {
    expect(() => assertTestDatabaseName("ricportal_test")).not.toThrow();
  });

  it.each(["ricportal", "ricportal_test_copy", "", null])(
    "refuses %s",
    (name) => {
      expect(errorFrom(() => assertTestDatabaseName(name)).message).toBe(
        "Connected database is not a test database; reset refused",
      );
    },
  );
});
