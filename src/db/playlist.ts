import { getGuildDatabase } from "./db.ts";
import { type DBPlaylist } from "./types.ts";

export async function createPlaylist(
  guildId: string,
  name: string,
) {
  const db = await getGuildDatabase(guildId);
  const guild_data = db.data;

  // Check if it exists using bracket notation
  if (guild_data.playlists[name]) {
    throw Error("PLAYLIST_EXIST");
  }

  // Assign the new playlist
  guild_data.playlists[name] = { tracks: [] };

  await db.write();
}

export async function getPlaylists(guildId: string) {
  const db = await getGuildDatabase(guildId);
  const guild_data = db.data;

  return guild_data.playlists;
}

export async function getPlaylist(
  guildId: string,
  name: string,
): Promise<DBPlaylist> {
  const playlists = await getPlaylists(guildId);

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  return playlists[name];
}

export async function deletePlaylist(
  guildId: string,
  name: string,
) {
  const db = await getGuildDatabase(guildId);
  const guild_data = db.data;
  const playlists = guild_data.playlists;

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  delete playlists[name];

  await db.write();
  return;
}

export async function renamePlaylist(
  guildId: string,
  name: string,
  new_name: string,
) {
  const db = await getGuildDatabase(guildId);
  const guild_data = db.data;
  const playlists = guild_data.playlists;

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  const playlist_data = playlists[name];
  delete playlists[name];

  playlists[new_name] = playlist_data;

  await db.write();
  return;
}
