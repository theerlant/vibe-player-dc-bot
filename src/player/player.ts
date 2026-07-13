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

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { StreamMixer } from "./utils/stream_mixer.ts";
import { StreamSynchronizer } from "./utils/stream_synchronizer.ts";

ffmpeg.setFfmpegPath(ffmpegPath!);

let i = 0;

const players = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupPlayer(
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: String,
) {
  players.set(guildId, { connection: player });

  const mixer = new StreamMixer();
  mixer.volumeB = 0.3;

  const synchronizer = new StreamSynchronizer(mixer, 65486);

  const [stream1, stream2] = [new PassThrough(), new PassThrough()];

  stream1.pipe(synchronizer.inputA);
  stream2.pipe(synchronizer.inputB);

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
    .pipe(stream1);

  const audioPath2 = join(__dirname, "test_002.mp3");
  ffmpeg(audioPath2)
    .format("s16le")
    .audioCodec("pcm_s16le")
    .audioFrequency(48000)
    .audioChannels(2)
    .inputOptions(`-stream_loop`, "-1")
    .on("error", (err) => console.error("FFmpeg 2 Error:", err.message))
    .pipe(stream2);

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
