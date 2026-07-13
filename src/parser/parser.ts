import type { DBPlaylist, DBTrack } from "../db/types";
import {
  getTrackFromUrl,
  getTracksFromPlaylistUrl,
  searchSoundcloud,
  searchYoutube,
  verifyUrl,
  getStreamUrl as ytGetStreamUrl,
} from "./youtube";

type searchSource = "youtube" | "soundcloud";

/**
 * Search for media by search query or url.
 * Each page only shows 10 entries.
 * @param query search query string
 * @param page page index
 * @param source specify source
 * @returns DBTrack if query is a valid track url.
 * @returns DBPlaylist if query is a valid playlist url.
 * @returns Array[DBTrack] as search result if query is plain search query.
 */
export async function searchMedia(
  query: string,
  page: number = 1,
  source: searchSource = "youtube",
): Promise<DBTrack | DBPlaylist | Array<DBTrack>> {
  // CASE 1: URL IS A VALID YOUTUBE OR SOUNDCLOUD LINK
  try {
    const result = await verifyUrl(query);

    if (result.entries) {
      return getTracksFromPlaylistUrl(query);
    } else {
      return getTrackFromUrl(query);
    }
  } catch (error) {
    // Throw only if video unavailable but url is valid.
    if (error instanceof Error && error.message === "VIDEO UNAVAILABLE") {
      throw error;
    }
  }

  // CASE 3: SEARCH QUERY
  if (source === "youtube") {
    return searchYoutube(query, page);
  } else if (source === "soundcloud") {
    return searchSoundcloud(query, page);
  }

  throw new Error(`Search source ${source} is not supported yet`);
}

/**
 * Gets the direct media stream URL for the provided url.
 * Prioritizes the most efficient audio format, allowing video up to 240p.
 */
export async function getStreamUrl(url: string): Promise<string> {
  return ytGetStreamUrl(url);
}
