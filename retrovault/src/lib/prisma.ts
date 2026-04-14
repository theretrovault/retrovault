import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3')
  const dbUrl = process.env.DATABASE_URL ?? 'file:./data/retrovault.db'
  const dbPath = dbUrl.replace(/^file:/, '')
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalThis.__prisma ?? createClient()
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
export default prisma
