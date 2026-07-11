import { getDatabase, getGuildData } from "./db";
import { unlink } from "node:fs";
import type { DBGuild, DBRoot, DBTrack } from "./types";
import type { Low } from "lowdb";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  renamePlaylist,
} from "./playlist";
import { addTrack, deleteTrack, switchTrack } from "./tracks";
import { describe, test, expect } from "vitest";

describe("LowDB database basic test", async () => {
  let db: Low<DBRoot>;
  const guildId = "test_guild";
  let playlistName = "test_playlist";

  test("create an empty database", async () => {
    db = await getDatabase("test");

    expect(db.data.guilds).toEqual({});
  });

  test("assign guild", async () => {
    const guild = await getGuildData(db, guildId);

    const empty: DBGuild = {
      playlists: {},
    };

    expect(guild).toEqual(empty);
  });

  test("create playlist", async () => {
    await createPlaylist(db, guildId, playlistName);

    expect((await getGuildData(db, guildId)).playlists[playlistName]).toEqual({
      tracks: [],
    });

    const playlist = await getPlaylist(db, guildId, playlistName);

    expect(playlist).toEqual({ tracks: [] });
  });

  const trackA: DBTrack = {
    title: "trackA",
    source: "local",
    duration: 60,
  };

  const trackB: DBTrack = {
    title: "trackB",
    source: "local",
    duration: 90,
  };

  test("add tracks to playlist", async () => {
    await addTrack(db, guildId, playlistName, trackA);
    await addTrack(db, guildId, playlistName, trackB);

    const tracks = (await getPlaylist(db, guildId, playlistName)).tracks;
    expect(tracks[0]).toEqual(trackA);
    expect(tracks[1]).toEqual(trackB);
  });

  test("switch tracks position", async () => {
    await switchTrack(db, guildId, playlistName, 0, 1);

    const tracks = (await getPlaylist(db, guildId, playlistName)).tracks;
    expect(tracks[0]).toEqual(trackB);
    expect(tracks[1]).toEqual(trackA);
  });

  test("delete track", async () => {
    await deleteTrack(db, guildId, playlistName, 0);

    const tracks = (await getPlaylist(db, guildId, playlistName)).tracks;
    expect(tracks.length).toBe(1);
    expect(tracks[0]).toEqual(trackA);
  });

  test("rename playlist", async () => {
    const oldName = playlistName;
    playlistName = "test_playlist_new";
    await renamePlaylist(db, guildId, oldName, playlistName);

    await expect(getPlaylist(db, guildId, oldName)).rejects.toThrow();
    expect(await getPlaylist(db, guildId, playlistName)).toEqual({
      tracks: [trackA],
    });
  });

  test("delete playlist", async () => {
    await deletePlaylist(db, guildId, playlistName);

    expect((await getGuildData(db, guildId)).playlists).toEqual({});
  });
});
