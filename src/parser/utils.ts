import type { DBTrack } from "../db/types";

export function entryToTrack(
  entry: Record<string, any>,
  source: DBTrack["source"] = "youtube",
): DBTrack {
  if (
    entry.title === undefined ||
    entry.duration === undefined ||
    entry.webpage_url === undefined
  ) {
    throw Error("VIDEO UNAVAILABLE");
  }

  const track: DBTrack = {
    title: entry.title,
    source: source,
    duration: entry.duration,
    url: entry.webpage_url,
  };

  return track;
}
