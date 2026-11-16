import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

// The only place that turns DATABASE_URL into a database connection (DEC-016).
// Nothing here logs, and errors use fixed messages, so the URL, user,
// password and host never leave this module.

export type DatabaseConnection = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  tls: boolean;
};

export type PoolOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  idleTimeout: number;
  initSql: string;
  ssl?: { rejectUnauthorized: true; minVersion: "TLSv1.2" };
};

const DEFAULT_PORT = 3306;
const POOL_SIZE = 5;
// Seconds. TiDB Cloud drops idle connections after 340 s and long-lived ones
// after 30 minutes, so idle connections are closed after 4 minutes.
const IDLE_TIMEOUT_SECONDS = 240;
// The application writes every time in UTC. A column default such as
// CURRENT_TIMESTAMP uses the session's time zone, which on a local MariaDB is
// the machine's (+08:00). Every connection is set to UTC, so a default gives
// the same time as the application (AUD-022). TiDB Cloud is UTC already.
const SESSION_TIME_ZONE_SQL = "SET time_zone = '+00:00'";

// Limits for interactive transactions (AUD-015). Prisma's defaults are 2
// seconds to get a connection and 5 seconds for the whole transaction. On a
// slow or busy database (this laptop short of memory, TiDB Cloud waking up, a
// row held by another request) that is too little: the transaction is
// cancelled and the request answers 500 although nothing is wrong. That is
// the most likely cause of the intermittent 404 in the assignments-week test
// (docs/AUDIT_REPORT.md section 4). These values are the default for every
// transaction of the client, and the week save passes them explicitly.
export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

export class DatabaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUrlError";
  }
}

function decodePart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new DatabaseUrlError(
      "DATABASE_URL user or password is not correctly percent-encoded",
    );
  }
}

function toUrl(databaseUrl: string): URL {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new DatabaseUrlError("DATABASE_URL is not a valid URL");
  }
}

export function parseDatabaseUrl(databaseUrl: string): DatabaseConnection {
  const url = toUrl(databaseUrl);

  if (url.protocol !== "mysql:") {
    throw new DatabaseUrlError("DATABASE_URL must start with mysql://");
  }
  if (url.hostname === "") {
    throw new DatabaseUrlError("DATABASE_URL must include a host");
  }

  const database = decodePart(url.pathname.replace(/^\//, ""));
  if (database === "") {
    throw new DatabaseUrlError("DATABASE_URL must include a database name");
  }

  const sslaccept = url.searchParams.get("sslaccept");
  if (sslaccept !== null && sslaccept !== "strict") {
    throw new DatabaseUrlError(
      "DATABASE_URL sslaccept must be strict when present",
    );
  }

  return {
    host: url.hostname,
    port: url.port === "" ? DEFAULT_PORT : Number(url.port),
    user: decodePart(url.username),
    password: decodePart(url.password),
    database,
    tls: sslaccept === "strict",
  };
}

export function buildPoolConfig(connection: DatabaseConnection): PoolOptions {
  const options: PoolOptions = {
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    connectionLimit: POOL_SIZE,
    idleTimeout: IDLE_TIMEOUT_SECONDS,
    initSql: SESSION_TIME_ZONE_SQL,
  };
  if (connection.tls) {
    options.ssl = { rejectUnauthorized: true, minVersion: "TLSv1.2" };
  }
  return options;
}

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const connection = parseDatabaseUrl(databaseUrl);
  const adapter = new PrismaMariaDb(buildPoolConfig(connection), {
    database: connection.database,
  });
  return new PrismaClient({
    adapter,
    transactionOptions: { ...TRANSACTION_OPTIONS },
  });
}
