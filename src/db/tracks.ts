import { getPlaylist } from "./playlist.ts";
import type { DBTrack } from "./types.ts";
import { getGuildDatabase } from "./db.ts";

/**
 * @returns index of added track
 */

export async function addTrack(
  guild_id: string,
  name: string,
  track: DBTrack,
) {
  const playlist = await getPlaylist(guild_id, name);

  playlist.tracks.push(track);
  const total = playlist.tracks.length;

  const db = await getGuildDatabase(guild_id);
  await db.write();
  return total - 1;
}

export async function deleteTrack(
  guild_id: string,
  name: string,
  index: number,
) {
  const playlist = await getPlaylist(guild_id, name);

  const tracks = playlist.tracks;
  if (index < 0 || index >= tracks.length) {
    throw Error("OUT OF BOUND");
  }

  tracks.splice(index, 1);

  const db = await getGuildDatabase(guild_id);
  await db.write();
  return;
}

export async function switchTrack(
  guild_id: string,
  name: string,
  a: number,
  b: number,
) {
  const tracks = (await getPlaylist(guild_id, name)).tracks;

  if (a < 0 || a >= tracks.length || b < 0 || b >= tracks.length) {
    throw Error("OUT OF BOUND");
  }

  const bTrack = tracks.at(b)!;
  tracks[b] = tracks[a]!;
  tracks[a] = bTrack;

  const db = await getGuildDatabase(guild_id);
  await db.write();
  return;
}
