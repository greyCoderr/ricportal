// Database scripts print only fixed text and an error code, never an error
// message, because driver messages can contain the host or user name.

export function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

export function fail(what: string, error: unknown): void {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : error instanceof Error
        ? error.name
        : "unknown";
  process.stderr.write(`${what} failed (code: ${code}).\n`);
  process.exitCode = 1;
}

export function requireDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    process.stderr.write("DATABASE_URL is missing.\n");
    process.exitCode = 1;
    return null;
  }
  return url;
}
