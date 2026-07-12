import type { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { DBGuild } from "./types.ts";
import fs from "fs";
import path from "path";

// Cache for LowDB instances to avoid creating multiple instances for the same file
const dbCache = new Map<string, Low<DBGuild>>();

/**
 * Get LowDB database instance for a specific guild
 * @param guildId Discord Guild ID
 * @returns LowDB instance for the guild
 */
export async function getGuildDatabase(guildId: string): Promise<Low<DBGuild>> {
  if (dbCache.has(guildId)) {
    return dbCache.get(guildId)!;
  }

  // Ensure the db directory exists
  const dbDir = path.join(process.cwd(), "db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbBlueprint: DBGuild = {
    playlists: {},
  };

  const dbPath = path.join(dbDir, `${guildId}.json`);
  const db = await JSONFilePreset(dbPath, dbBlueprint);

  dbCache.set(guildId, db);
  return db;
}
