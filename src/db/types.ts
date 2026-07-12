

export type DBGuild = {
  playlists: Record<string, DBPlaylist>;
};

export type DBPlaylist = {
  tracks: DBTrack[];
};

export type DBTrack = {
  title: string;
  source: DBTrackSource;
  duration: number;
  url: string;
};

export type DBTrackSource = "youtube" | "soundcloud" | "direct-url";
