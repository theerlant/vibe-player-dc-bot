import { Writable } from "stream";

export class StreamSynchronizer {
  public inputA: Writable;
  public inputB: Writable;

  private bufferA: Buffer = Buffer.alloc(0);
  private bufferB: Buffer = Buffer.alloc(0);

  private MAX_BUFFER_SIZE: number;
  private destinationMixer: Writable;
  private chunkSize: number;

  private callbackA: (() => void) | null = null;
  private callbackB: (() => void) | null = null;

  private isMixerBlocked = false;
  private dispatchTimeout: NodeJS.Timeout | null = null;
  private MAX_WAIT_MS = 20;

  constructor(destinationMixer: Writable, chunkSize = 3840) {
    this.destinationMixer = destinationMixer;
    this.chunkSize = chunkSize;
    this.MAX_BUFFER_SIZE = this.chunkSize * 10;

    this.inputA = this.createInput("A");
    this.inputB = this.createInput("B");

    this.destinationMixer.on("drain", () => {
      console.log("🟢 [Mixer] Drained! Resuming flow...");
      this.isMixerBlocked = false;
      this.tryDispatch();
    });

    // Catch silent errors
    this.destinationMixer.on("error", (err) => {
      console.error("❌ [Mixer ERROR]:", err);
    });
  }

  private createInput(side: "A" | "B"): Writable {
    const self = this;
    return new Writable({
      highWaterMark: this.MAX_BUFFER_SIZE,
      write(chunk: Buffer, encoding, callback) {
        if (side === "A") {
          self.bufferA = Buffer.concat([self.bufferA, chunk]);
          self.callbackA = callback;
        } else {
          self.bufferB = Buffer.concat([self.bufferB, chunk]);
          self.callbackB = callback;
        }

        // LOGGING: See exactly what data is arriving
        console.log(
          `📥 [Input ${side}] Got ${chunk.length} bytes. (Total ${side}: ${side === "A" ? self.bufferA.length : self.bufferB.length})`,
        );

        self.tryDispatch();
      },
    });
  }

  private tryDispatch(force = false) {
    // 1. Process mixed chunks
    while (!this.isMixerBlocked) {
      const aReady = this.bufferA.length >= this.chunkSize;
      const bReady = this.bufferB.length >= this.chunkSize;

      if (aReady && bReady) {
        const chunkA = this.bufferA.subarray(0, this.chunkSize);
        const chunkB = this.bufferB.subarray(0, this.chunkSize);

        this.bufferA = this.bufferA.subarray(this.chunkSize);
        this.bufferB = this.bufferB.subarray(this.chunkSize);

        console.log(
          `⚡ [Dispatch] Sending ${this.chunkSize} bytes to mixer...`,
        );
        const canKeepWriting = this.destinationMixer.write({ chunkA, chunkB });

        if (!canKeepWriting) {
          console.log("🔴 [Mixer] Blocked! Waiting for drain...");
          this.isMixerBlocked = true;
        }
      } else if (force && (aReady || bReady)) {
        const chunkA = aReady
          ? this.bufferA.subarray(0, this.chunkSize)
          : Buffer.alloc(this.chunkSize);
        const chunkB = bReady
          ? this.bufferB.subarray(0, this.chunkSize)
          : Buffer.alloc(this.chunkSize);

        if (aReady) this.bufferA = this.bufferA.subarray(this.chunkSize);
        if (bReady) this.bufferB = this.bufferB.subarray(this.chunkSize);

        console.log(
          `⚡ [Dispatch] (Forced) Sending ${this.chunkSize} bytes to mixer...`,
        );
        const canKeepWriting = this.destinationMixer.write({ chunkA, chunkB });

        if (!canKeepWriting) {
          console.log("🔴 [Mixer] Blocked! Waiting for drain...");
          this.isMixerBlocked = true;
        }
      } else {
        break;
      }
    }

    // Handle timeout logic
    if (
      !this.isMixerBlocked &&
      (this.bufferA.length >= this.chunkSize ||
        this.bufferB.length >= this.chunkSize)
    ) {
      if (!this.dispatchTimeout) {
        this.dispatchTimeout = setTimeout(() => {
          this.dispatchTimeout = null;
          this.tryDispatch(true);
        }, this.MAX_WAIT_MS);
      }
    } else {
      if (this.dispatchTimeout) {
        clearTimeout(this.dispatchTimeout);
        this.dispatchTimeout = null;
      }
    }

    // 2. Safely release callbacks (Using setImmediate prevents Sync Deadlock)
    if (this.callbackA && this.bufferA.length < this.MAX_BUFFER_SIZE) {
      const cb = this.callbackA;
      this.callbackA = null;
      setImmediate(() => cb());
    }

    if (this.callbackB && this.bufferB.length < this.MAX_BUFFER_SIZE) {
      const cb = this.callbackB;
      this.callbackB = null;
      setImmediate(() => cb());
    }
  }
}
