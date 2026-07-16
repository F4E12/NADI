import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/posko.db";

function enableWriteAheadLog() {
  const file = url.replace(/^file:/, "");
  if (file === ":memory:") return;

  const sqlite = new Database(file);
  try {
    sqlite.pragma("journal_mode = WAL");
  } finally {
    sqlite.close();
  }
}

enableWriteAheadLog();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
