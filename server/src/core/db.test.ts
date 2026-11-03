import { describe, expect, it } from "vitest";
import {
  buildPoolConfig,
  createPrismaClient,
  DatabaseUrlError,
  parseDatabaseUrl,
} from "./db.js";

function errorFrom(url: string): DatabaseUrlError {
  try {
    parseDatabaseUrl(url);
  } catch (error) {
    if (error instanceof DatabaseUrlError) {
      return error;
    }
    throw error;
  }
  throw new Error("parseDatabaseUrl did not throw");
}

describe("parseDatabaseUrl", () => {
  it("parses the local XAMPP URL with TLS off", () => {
    expect(parseDatabaseUrl("mysql://root@127.0.0.1:3306/ricportal")).toEqual({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "ricportal",
      tls: false,
    });
  });

  it("parses a TiDB-style URL with a dotted user prefix and TLS on", () => {
    expect(
      parseDatabaseUrl(
        "mysql://4abc.root:pw@gateway.example.com:4000/ricportal_scratch?sslaccept=strict",
      ),
    ).toEqual({
      host: "gateway.example.com",
      port: 4000,
      user: "4abc.root",
      password: "pw",
      database: "ricportal_scratch",
      tls: true,
    });
  });

  it("decodes percent-encoded @ : % / in the password", () => {
    const parsed = parseDatabaseUrl(
      "mysql://app:p%40ss%3Aw%25rd%2Fx@db.example.com:3306/ricportal",
    );

    expect(parsed.password).toBe("p@ss:w%rd/x");
    expect(parsed.host).toBe("db.example.com");
  });

  it("accepts a raw @ and : inside the password", () => {
    const parsed = parseDatabaseUrl(
      "mysql://app:p@ss:word@db.example.com:3306/ricportal",
    );

    expect(parsed.user).toBe("app");
    expect(parsed.password).toBe("p@ss:word");
    expect(parsed.host).toBe("db.example.com");
  });

  it("decodes a percent-encoded user name", () => {
    expect(
      parseDatabaseUrl("mysql://us%40er:pw@localhost/ricportal").user,
    ).toBe("us@er");
  });

  it("uses port 3306 when no port is given", () => {
    expect(parseDatabaseUrl("mysql://root@localhost/ricportal").port).toBe(
      3306,
    );
  });

  it.each([
    [
      "mysql://root@127.0.0.1:3306",
      "DATABASE_URL must include a database name",
    ],
    [
      "mysql://root@127.0.0.1:3306/",
      "DATABASE_URL must include a database name",
    ],
    [
      "postgres://root@127.0.0.1:5432/ricportal",
      "DATABASE_URL must start with mysql://",
    ],
    ["not a url", "DATABASE_URL is not a valid URL"],
    ["mysql:///ricportal", "DATABASE_URL must include a host"],
    [
      "mysql://root@127.0.0.1:3306/ricportal?sslaccept=accept_invalid_certs",
      "DATABASE_URL sslaccept must be strict when present",
    ],
    [
      "mysql://root:%zz@127.0.0.1:3306/ricportal",
      "DATABASE_URL user or password is not correctly percent-encoded",
    ],
  ])("rejects %s", (url, message) => {
    expect(errorFrom(url).message).toBe(message);
  });

  it.each([
    "mysql://secretuser:SuperSecret123@secret-host.example.com:4000",
    "mysql://secretuser:SuperSecret123@secret-host.example.com:4000/db?sslaccept=yes",
    "mysql://secretuser:%zzSuperSecret123@secret-host.example.com:4000/db",
    "postgres://secretuser:SuperSecret123@secret-host.example.com:4000/db",
  ])("never puts the URL, user, password or host in the error (%#)", (url) => {
    const error = errorFrom(url);
    const text = `${error.message} ${String(error.stack)}`;

    expect(text).not.toContain(url);
    expect(text).not.toContain("SuperSecret123");
    expect(text).not.toContain("secretuser");
    expect(text).not.toContain("secret-host");
  });
});

describe("buildPoolConfig", () => {
  const base = {
    host: "h",
    port: 4000,
    user: "u",
    password: "p",
    database: "d",
  };

  it("enables verified TLS 1.2+ when tls is on, with a small pool and short idle timeout", () => {
    const config = buildPoolConfig({ ...base, tls: true });

    expect(config.ssl).toEqual({
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    });
    expect(config.connectionLimit).toBe(5);
    expect(config.idleTimeout).toBeLessThan(300);
    expect(config).toMatchObject({
      host: "h",
      port: 4000,
      user: "u",
      password: "p",
      database: "d",
    });
  });

  it("has no ssl option when tls is off", () => {
    expect(buildPoolConfig({ ...base, tls: false })).not.toHaveProperty("ssl");
  });
});

describe("createPrismaClient", () => {
  it("builds a client without opening a connection", async () => {
    const client = createPrismaClient("mysql://root@127.0.0.1:1/never_used");

    expect(typeof client.$queryRaw).toBe("function");
    await client.$disconnect();
  });
});

describe("parseDatabaseUrl with the production URL form (DEC-018)", () => {
  it("accepts connect_timeout=30 next to sslaccept=strict and keeps TLS on", () => {
    expect(
      parseDatabaseUrl(
        "mysql://4abc.root:pw@gateway.example.com:4000/ricportal?sslaccept=strict&connect_timeout=30",
      ),
    ).toEqual({
      host: "gateway.example.com",
      port: 4000,
      user: "4abc.root",
      password: "pw",
      database: "ricportal",
      tls: true,
    });
  });
});
