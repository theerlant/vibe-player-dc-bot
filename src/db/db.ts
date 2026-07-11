import type { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { DBRoot, DBGuild } from "./types.ts";

/**
 * Get LowDB database instance
 * @returns LowDB instance
 */
export async function getDatabase(dbName: string): Promise<Low<DBRoot>> {
  const dbBlueprint: DBRoot = {
    guilds: {}, // Initialize as an empty object instead of a Map
  };

  const db = await JSONFilePreset(`${dbName}.json`, dbBlueprint);
  return db;
}

/**
 * Get guild attached playlists and tracks
 * @param db LowDB database instance
 * @param guild_id Discord Guild ID
 * @returns Guild data
 */
export async function getGuildData(
  db: Low<DBRoot>,
  guild_id: string,
): Promise<DBGuild> {
  // Access directly using bracket notation
  const guildData = db.data.guilds[guild_id];

  if (guildData === undefined) {
    // Create empty guild data with plain objects
    const emptyGuildData: DBGuild = {
      playlists: {},
    };

    // Assign directly and save
    db.data.guilds[guild_id] = emptyGuildData;
    await db.write();

    return emptyGuildData;
  }

  return guildData;
}
