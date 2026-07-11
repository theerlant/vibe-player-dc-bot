import type { Low } from "lowdb";
import { getGuildData } from "./db.ts";
import { type DBPlaylist, type DBRoot } from "./types.ts";

export async function createPlaylist(
  db: Low<DBRoot>,
  guildId: string,
  name: string,
) {
  const guild_data = await getGuildData(db, guildId);

  // Check if it exists using bracket notation
  if (guild_data.playlists[name]) {
    throw Error("PLAYLIST_EXIST");
  }

  // Assign the new playlist
  guild_data.playlists[name] = { tracks: [] };

  await db.write();
}

export async function getPlaylists(db: Low<DBRoot>, guildId: string) {
  const guild_data = await getGuildData(db, guildId);

  return guild_data.playlists;
}

export async function getPlaylist(
  db: Low<DBRoot>,
  guildId: string,
  name: string,
): Promise<DBPlaylist> {
  const playlists = await getPlaylists(db, guildId);

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  return playlists[name];
}

export async function deletePlaylist(
  db: Low<DBRoot>,
  guildId: string,
  name: string,
) {
  const playlists = await getPlaylists(db, guildId);

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  delete playlists[name];

  await db.write();
  return;
}

export async function renamePlaylist(
  db: Low<DBRoot>,
  guildId: string,
  name: string,
  new_name: string,
) {
  const playlists = await getPlaylists(db, guildId);

  if (!playlists[name]) {
    throw Error("PLAYLIST NOT FOUND");
  }

  const playlist_data = playlists[name];
  delete playlists[name];

  playlists[new_name] = playlist_data;

  await db.write();
  return;
}
