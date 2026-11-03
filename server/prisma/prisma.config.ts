import { defineConfig } from "prisma/config";

// This file never loads an env file (DEC-017). Scripts that need the database
// pass one with node --env-file (.env for local, .env.tidb for TiDB).
// `prisma generate` needs no database, so DATABASE_URL may be unset there.
export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
