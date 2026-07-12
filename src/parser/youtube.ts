import { exec, type ExecException } from "child_process";
import { error } from "console";
import os from "os";
import path from "path";
import util from "util";
import type { DBPlaylist, DBTrack } from "../db/types";
import { entryToTrack } from "./utils";
import { stdout } from "process";

const execAsync = util.promisify(exec);

const isWindows = os.platform() === "win32";
const binaryName = isWindows ? "yt-dlp.exe" : "yt-dlp";

const executablePath = path.join("binary", binaryName);

const options = "--no-warnings";

export async function verifyUrl(url: string): Promise<Record<string, any>> {
  const command = `${executablePath} --simulate ${options} "${url}"`;

  try {
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  } catch (e) {
    const error = e as ExecException;
    const stderr = error.stderr || "";
    if (stderr.includes("unavailable") || stderr.includes("DRM")) {
      throw Error("VIDEO UNAVAILABLE");
    } else {
      throw Error(`UNKNOWN ERROR: ${stderr}`);
    }
  }
}

/**
 * get DBTrack object from youtube url. Assuming valid url, check it first with verifyUrl.
 * @param url youtube url
 */
export async function getTrackFromUrl(url: string): Promise<DBTrack> {
  const command = `${executablePath} --dump-json ${options} ${url}`;

  const { stdout } = await execAsync(command);

  const jsonResult = JSON.parse(stdout);
  return entryToTrack(jsonResult);
}

export async function getTracksFromPlaylistUrl(
  url: string,
): Promise<DBPlaylist> {
  const command = `${executablePath} --flat-playlist -J ${options} ${url}`;

  const { stdout } = await execAsync(command);

  const jsonResult = JSON.parse(stdout);
  const playlist: DBPlaylist = {
    tracks: [],
  };

  if (!jsonResult.entries) {
    return playlist;
  }

  jsonResult.entries.forEach((entry: Record<string, any>) => {
    try {
      const track = entryToTrack(entry);
      playlist.tracks.push(track);
    } catch (e) {
      console.error("Error adding entry as track:", entry, "| reason:", e);
    }
  });

  return playlist;
}
export async function searchYoutube(
  query: string,
  page: number = 1,
): Promise<Array<DBTrack>> {
  const limit = 10;
  const start = (page - 1) * limit + 1;
  const end = page * limit;
  const searchAmount = end;
  const command = `${executablePath} --flat-playlist -J --playlist-items ${start}-${end} ${options} "ytsearch${searchAmount}:${query}"`;

  const { stdout } = await execAsync(command);

  const jsonResult = JSON.parse(stdout);
  const tracks: Array<DBTrack> = [];

  if (!jsonResult.entries) {
    return tracks;
  }

  jsonResult.entries.forEach((entry: Record<string, any>) => {
    try {
      const track = entryToTrack(entry);
      tracks.push(track);
    } catch (e) {
      console.error("Error adding entry as track:", entry, "| reason:", e);
    }
  });

  return tracks;
}

export async function searchSoundcloud(
  query: string,
  page: number = 1,
): Promise<Array<DBTrack>> {
  const limit = 10;
  const start = (page - 1) * limit + 1;
  const end = page * limit;
  const searchAmount = end;
  const command = `${executablePath} --flat-playlist -J --playlist-items ${start}-${end} ${options} "scsearch${searchAmount}:${query}"`;

  const { stdout } = await execAsync(command);

  const jsonResult = JSON.parse(stdout);
  const tracks: Array<DBTrack> = [];

  if (!jsonResult.entries) {
    return tracks;
  }

  jsonResult.entries.forEach((entry: Record<string, any>) => {
    try {
      const track = entryToTrack(entry, "soundcloud");
      tracks.push(track);
    } catch (e) {
      console.error("Error adding entry as track:", entry, "| reason:", e);
    }
  });

  return tracks;
}

