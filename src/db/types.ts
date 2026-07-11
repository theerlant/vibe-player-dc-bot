export type DBRoot = {
  guilds: Record<string, DBGuild>;
};

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
};

export type DBTrackSource = "youtube" | "local" | "direct-url";
