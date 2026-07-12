import { getGuildDatabase } from "./db";
import { unlink } from "node:fs/promises";
import path from "node:path";
import type { DBGuild, DBTrack } from "./types";
import type { Low } from "lowdb";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  renamePlaylist,
} from "./playlist";
import { addTrack, deleteTrack, switchTrack } from "./tracks";
import { describe, test, expect, afterAll } from "vitest";

describe("LowDB database basic test", async () => {
  let db: Low<DBGuild>;
  const guildId = "test_guild";
  let playlistName = "test_playlist";

  afterAll(async () => {
    // Clean up test database file
    const dbPath = path.join(process.cwd(), "db", `${guildId}.json`);
    try {
      await unlink(dbPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  test("create an empty database", async () => {
    db = await getGuildDatabase(guildId);

    const empty: DBGuild = {
      playlists: {},
    };

    expect(db.data).toEqual(empty);
  });

  test("create playlist", async () => {
    await createPlaylist(guildId, playlistName);

    expect((await getGuildDatabase(guildId)).data.playlists[playlistName]).toEqual({
      tracks: [],
    });

    const playlist = await getPlaylist(guildId, playlistName);

    expect(playlist).toEqual({ tracks: [] });
  });

  const trackA: DBTrack = {
    title: "trackA",
    source: "direct-url",
    duration: 60,
    url: "test",
  };

  const trackB: DBTrack = {
    title: "trackB",
    source: "direct-url",
    duration: 90,
    url: "test",
  };

  test("add tracks to playlist", async () => {
    await addTrack(guildId, playlistName, trackA);
    await addTrack(guildId, playlistName, trackB);

    const tracks = (await getPlaylist(guildId, playlistName)).tracks;
    expect(tracks[0]).toEqual(trackA);
    expect(tracks[1]).toEqual(trackB);
  });

  test("switch tracks position", async () => {
    await switchTrack(guildId, playlistName, 0, 1);

    const tracks = (await getPlaylist(guildId, playlistName)).tracks;
    expect(tracks[0]).toEqual(trackB);
    expect(tracks[1]).toEqual(trackA);
  });

  test("delete track", async () => {
    await deleteTrack(guildId, playlistName, 0);

    const tracks = (await getPlaylist(guildId, playlistName)).tracks;
    expect(tracks.length).toBe(1);
    expect(tracks[0]).toEqual(trackA);
  });

  test("rename playlist", async () => {
    const oldName = playlistName;
    playlistName = "test_playlist_new";
    await renamePlaylist(guildId, oldName, playlistName);

    await expect(getPlaylist(guildId, oldName)).rejects.toThrow();
    expect(await getPlaylist(guildId, playlistName)).toEqual({
      tracks: [trackA],
    });
  });

  test("delete playlist", async () => {
    await deletePlaylist(guildId, playlistName);

    expect((await getGuildDatabase(guildId)).data.playlists).toEqual({});
  });
});
