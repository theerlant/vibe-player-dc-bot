import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchMedia } from "./parser";
import * as youtube from "./youtube";

vi.mock("./youtube", () => ({
  verifyUrl: vi.fn(),
  getTrackFromUrl: vi.fn(),
  getTracksFromPlaylistUrl: vi.fn(),
  searchYoutube: vi.fn(),
  searchSoundcloud: vi.fn(),
}));

describe("parser - searchMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a DBTrack when given a valid track URL", async () => {
    const mockTrack = { title: "Test Track", duration: 100, url: "http://example.com/track", source: "youtube" as const };
    
    vi.mocked(youtube.verifyUrl).mockResolvedValueOnce({ id: "123", title: "Test" });
    vi.mocked(youtube.getTrackFromUrl).mockResolvedValueOnce(mockTrack);

    const result = await searchMedia("https://youtube.com/watch?v=123");
    
    expect(youtube.verifyUrl).toHaveBeenCalledWith("https://youtube.com/watch?v=123");
    expect(youtube.getTrackFromUrl).toHaveBeenCalledWith("https://youtube.com/watch?v=123");
    expect(result).toEqual(mockTrack);
  });

  it("should return a DBPlaylist when given a valid playlist URL", async () => {
    const mockPlaylist = { tracks: [{ title: "Test Track 1", duration: 100, url: "http://example.com/track1", source: "youtube" as const }] };
    
    // entries property indicates it's a playlist
    vi.mocked(youtube.verifyUrl).mockResolvedValueOnce({ entries: [{ id: "123" }] });
    vi.mocked(youtube.getTracksFromPlaylistUrl).mockResolvedValueOnce(mockPlaylist);

    const result = await searchMedia("https://youtube.com/playlist?list=123");
    
    expect(youtube.verifyUrl).toHaveBeenCalledWith("https://youtube.com/playlist?list=123");
    expect(youtube.getTracksFromPlaylistUrl).toHaveBeenCalledWith("https://youtube.com/playlist?list=123");
    expect(result).toEqual(mockPlaylist);
  });

  it("should throw VIDEO UNAVAILABLE error if URL is valid but media is unavailable", async () => {
    vi.mocked(youtube.verifyUrl).mockRejectedValueOnce(new Error("VIDEO UNAVAILABLE"));

    await expect(searchMedia("https://youtube.com/watch?v=unavailable")).rejects.toThrow("VIDEO UNAVAILABLE");
    expect(youtube.verifyUrl).toHaveBeenCalledWith("https://youtube.com/watch?v=unavailable");
    expect(youtube.getTrackFromUrl).not.toHaveBeenCalled();
    expect(youtube.searchYoutube).not.toHaveBeenCalled();
  });

  it("should fallback to searchYoutube when query is not a valid URL and source is youtube", async () => {
    const mockSearchResults = [{ title: "Search Result 1", duration: 200, url: "http://example.com/search1", source: "youtube" as const }];
    
    // yt-dlp simulate fails for generic search strings without ytsearch:, throwing a general error
    vi.mocked(youtube.verifyUrl).mockRejectedValueOnce(new Error("UNKNOWN ERROR: not a valid url"));
    vi.mocked(youtube.searchYoutube).mockResolvedValueOnce(mockSearchResults);

    const result = await searchMedia("cyberpunk ambient", 2);
    
    expect(youtube.verifyUrl).toHaveBeenCalledWith("cyberpunk ambient");
    expect(youtube.searchYoutube).toHaveBeenCalledWith("cyberpunk ambient", 2);
    expect(result).toEqual(mockSearchResults);
  });

  it("should fallback to searchSoundcloud when query is not a valid URL and source is soundcloud", async () => {
    const mockSearchResults = [{ title: "Soundcloud Result 1", duration: 200, url: "http://example.com/search1", source: "soundcloud" as const }];
    
    vi.mocked(youtube.verifyUrl).mockRejectedValueOnce(new Error("UNKNOWN ERROR: not a valid url"));
    vi.mocked(youtube.searchSoundcloud).mockResolvedValueOnce(mockSearchResults);

    const result = await searchMedia("lofi beats", 1, "soundcloud");
    
    expect(youtube.verifyUrl).toHaveBeenCalledWith("lofi beats");
    expect(youtube.searchSoundcloud).toHaveBeenCalledWith("lofi beats", 1);
    expect(result).toEqual(mockSearchResults);
  });
});
