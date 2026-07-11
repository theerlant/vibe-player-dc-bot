import {
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  type AudioPlayer,
  type VoiceConnection,
} from "@discordjs/voice";
import { PassThrough } from "stream";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath!);

const players = new Map();

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPlayer(
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: String,
) {
  players.set(guildId, { connection: player });

  const stream = new PassThrough();
  const audioPath = join(__dirname, "test_001.mp3");
  ffmpeg(audioPath).format("mp3").pipe(stream);

  const resource = createAudioResource(stream);

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
