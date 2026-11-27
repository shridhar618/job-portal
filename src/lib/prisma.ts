import { PrismaClient } from "@prisma/client";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, seedDemoData } from "../../prisma/demo-data.mjs";
import { DEMO_SCHEMA_SQL } from "./demo-schema";

/**
 * Demo mode: with no DATABASE_URL, the app runs on an in-memory Postgres (PGlite) that is
 * created and filled with the demo jobs and accounts when the server starts. Everything
 * works, but data is temporary: each server instance has its own copy, and it's reset
 * when the instance restarts. Set DATABASE_URL to use a real database.
 */
export const isDemoMode = !process.env.DATABASE_URL;

function createDemoClient(): PrismaClient {
  const pg = new PGlite();
  // pglite-prisma-adapter@0.6 is typed against an older Prisma 6 adapter interface; the
  // runtime contract is the same, so cast past the type mismatch.
  const base = new PrismaClient({ adapter: new PrismaPGlite(pg) as never });
  const ready = (async () => {
    await pg.waitReady;
    await pg.exec(DEMO_SCHEMA_SQL);
    await seedDemoData(base, await bcrypt.hash(DEMO_PASSWORD, 10));
  })();
  // Every query waits until the tables and demo data exist.
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        await ready;
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

// Reuse one client across hot reloads in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? (isDemoMode ? createDemoClient() : new PrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
