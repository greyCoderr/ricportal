import { DatabaseUrlError, parseDatabaseUrl } from "../src/core/db.js";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const DEMO_DATABASE = "ricportal";

export class DemoSeedRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoSeedRefused";
  }
}

// The demo seed clears data, so it runs only on this machine's ricportal
// database and never in production (sprint plan S6). Fixed messages: the URL
// is never shown.
export function assertDemoDatabase(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): void {
  if (nodeEnv === "production") {
    throw new DemoSeedRefused("The demo seed never runs in production.");
  }
  if (databaseUrl === undefined || databaseUrl === "") {
    throw new DemoSeedRefused("DATABASE_URL is missing.");
  }
  let connection: ReturnType<typeof parseDatabaseUrl>;
  try {
    connection = parseDatabaseUrl(databaseUrl);
  } catch (error) {
    if (error instanceof DatabaseUrlError) {
      throw new DemoSeedRefused("DATABASE_URL is not valid.");
    }
    throw error;
  }
  if (!LOCAL_HOSTS.has(connection.host)) {
    throw new DemoSeedRefused("The demo seed runs only on a local database.");
  }
  if (connection.database !== DEMO_DATABASE) {
    throw new DemoSeedRefused(
      "The demo seed runs only on the ricportal database.",
    );
  }
}
