import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/**
 * With DATABASE_URL set we talk to a real Postgres server (production).
 * Without it we run PGlite, Postgres compiled to WebAssembly, storing data in
 * .data/ so the app works with zero setup. Same SQL, same migrations.
 */
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 10 });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory://") mkdirSync(dir, { recursive: true });
  const db = drizzle(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  // The query builder API is identical; only the driver type differs.
  return db as unknown as Db;
}

// Keep one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { backlineDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.backlineDb ??= connect().catch((err) => {
    globalForDb.backlineDb = undefined;
    throw err;
  });
  return globalForDb.backlineDb;
}

export { schema };
