import { pool } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await pool.query<{ value: string }>(
      "SELECT value FROM settings WHERE key = $1",
      [key],
    );
    return result.rows[0]?.value ?? null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) 
     VALUES ($1, $2, NOW()) 
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const result = await pool.query<{ key: string; value: string }>(
      "SELECT key, value FROM settings",
    );
    return result.rows.reduce(
      (acc, row) => {
        acc[row.key] = row.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  } catch (error) {
    console.error("Error fetching all settings:", error);
    return {};
  }
}
