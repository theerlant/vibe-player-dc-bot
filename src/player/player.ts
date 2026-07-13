import {
  createAudioResource,
  entersState,
  StreamType,
  VoiceConnectionStatus,
  type AudioPlayer,
  type VoiceConnection,
} from "@discordjs/voice";
import { PassThrough } from "stream";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import ffmpeg, { type FfmpegCommand } from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { StreamMixer } from "./utils/stream-mixer.ts";
import { StreamSynchronizer } from "./utils/stream-synchronizer.ts";
import type { DBTrack } from "../db/types.ts";

ffmpeg.setFfmpegPath(ffmpegPath!);

export type Player = {
  player: AudioPlayer;
  mixer: StreamMixer;
  synchronizer: StreamSynchronizer;
  queue: {
    tracks: DBTrack[];
    loopMode?: "all" | "single";
  };
  foregroundTrack?: TrackPlayback;
  backgroundTrack?: TrackPlayback;
};

export type TrackPlayback = {
  title: string;
  duration: number;
  progress: number;
  volume: number;
  process: FfmpegCommand;
};

const players = new Map<string, Player>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPlayer(
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
) {
  const mixer = new StreamMixer();
  const synchronizer = new StreamSynchronizer(mixer);

  players.set(guildId, {
    player: player,
    mixer: mixer,
    synchronizer: synchronizer,
    queue: { tracks: [] },
  });

  const resource = createAudioResource(mixer, {
    inputType: StreamType.Raw,
  });

  const audioPath = join(__dirname, "test_001.mp3");
  ffmpeg(audioPath)
    .format("s16le")
    .audioCodec("pcm_s16le")
    .audioFrequency(48000)
    .audioChannels(2)
    .inputOptions(`-stream_loop`, "-1")
    .on("error", (err) => console.error("FFmpeg 1 Error:", err.message))
    .pipe(synchronizer.inputA);

  const audioPath2 = join(__dirname, "test_002.mp3");
  ffmpeg(audioPath2)
    .format("s16le")
    .audioCodec("pcm_s16le")
    .audioFrequency(48000)
    .audioChannels(2)
    .inputOptions(`-stream_loop`, "-1")
    .on("error", (err) => console.error("FFmpeg 2 Error:", err.message))
    .pipe(synchronizer.inputB);

  player.play(resource);

  connection.on(
    VoiceConnectionStatus.Disconnected,
    async (oldState, newState) => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        // If it doesn't reconnect within 5 seconds, destroy it completely
        console.log(`[Guild ${guildId}] Bot was disconnected or kicked.`);
        connection.destroy();
        players.delete(guildId);
      }
    },
  );
}

export function startPlayback(guildId: string) {
  if (!players.get(guildId)) {
    throw Error("PLAYER NOT INITIALIZED");
  }
}
