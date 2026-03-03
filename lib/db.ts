import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Silakan isi di .env.local");
}

export const pool =
  global.pgPool ??
  new Pool({
    connectionString: connectionString.includes("sslmode")
      ? connectionString.split("?")[0]
      : connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}
