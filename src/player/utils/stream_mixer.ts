import { Transform, type TransformCallback } from "stream";

interface AudioChunkPair {
  chunkA: Buffer;
  chunkB: Buffer;
}

export class StreamMixer extends Transform {
  volumeA: number = 1.0;
  volumeB: number = 1.0;

  constructor() {
    super({
      writableObjectMode: true,
      readableObjectMode: false,
    });
  }

  override _transform(
    pair: AudioChunkPair,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    try {
      // PROBE 1: Did the chunk even make it inside?
      console.log(
        `🛠️ [Mixer] Mixing ${pair.chunkA?.length}B and ${pair.chunkB?.length}B...`,
      );

      // Find the shortest length to avoid bounds errors
      const length = Math.min(pair.chunkA.length, pair.chunkB.length);
      const mixed = Buffer.alloc(length);

      for (let i = 0; i < length; i += 2) {
        const sampleA = pair.chunkA.readInt16LE(i);
        const sampleB = pair.chunkB.readInt16LE(i);

        let mixedSample = sampleA * this.volumeA + sampleB * this.volumeB;

        // Hard Clipping
        if (mixedSample > 32767) mixedSample = 32767;
        else if (mixedSample < -32768) mixedSample = -32768;

        mixed.writeInt16LE(mixedSample, i);
      }

      // PROBE 2: Did the math succeed?
      console.log(
        `✅ [Mixer] Successfully mixed ${mixed.length} bytes. Pushing to output...`,
      );

      // Send the raw audio buffer out. This triggers 'data' and empties the queue.
      callback(null, mixed);
    } catch (error) {
      // PROBE 3: Did the math crash?
      console.error("❌ [Mixer] FATAL MATH ERROR:", error);
      callback(error as Error);
    }
  }
}
