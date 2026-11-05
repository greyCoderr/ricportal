import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Test helper: lists client source files with their text, for scans.
export const CLIENT_DIR = fileURLToPath(new URL("..", import.meta.url));

export type SourceFile = { path: string; text: string };

const SOURCE_EXT = /\.(ts|tsx|css|html)$/;
const TEST_FILE = /\.test\.(ts|tsx)$/;

export function clientSourceFiles(): SourceFile[] {
  const srcDir = join(CLIENT_DIR, "src");
  const paths = readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .map((name) => join(srcDir, name))
    .filter((path) => SOURCE_EXT.test(path) && !TEST_FILE.test(path));
  paths.push(join(CLIENT_DIR, "index.html"));
  return paths.map((path) => ({
    path: relative(CLIENT_DIR, path).split(sep).join("/"),
    text: readFileSync(path, "utf8"),
  }));
}
