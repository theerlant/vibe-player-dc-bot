package ffmpeg

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// minimalWAV is a tiny valid WAV file payload (1 sample of silence)
var minimalWAV = []byte{
	0x52, 0x49, 0x46, 0x46, // "RIFF"
	0x26, 0x00, 0x00, 0x00, // Chunk size (38)
	0x57, 0x41, 0x56, 0x45, // "WAVE"
	0x66, 0x6d, 0x74, 0x20, // "fmt "
	0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16)
	0x01, 0x00, // AudioFormat (1)
	0x01, 0x00, // NumChannels (1)
	0x44, 0xac, 0x00, 0x00, // SampleRate (44100)
	0x88, 0x58, 0x01, 0x00, // ByteRate
	0x02, 0x00, // BlockAlign
	0x10, 0x00, // BitsPerSample (16)
	0x64, 0x61, 0x74, 0x61, // "data"
	0x02, 0x00, 0x00, 0x00, // Subchunk2Size (2)
	0x00, 0x00, // The 1 sample of silence
}

func TestFFMpeg_ProcessLifecycle(t *testing.T) {
	ff, err := New()
	if err != nil {
		t.Fatalf("Failed to initialize FFmpeg: %v", err)
	}

	// 1. Setup a dummy input file
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "dummy.wav")
	if err := os.WriteFile(inputPath, minimalWAV, 0644); err != nil {
		t.Fatalf("Failed to write dummy input: %v", err)
	}

	// 2. Create the process
	pipe, err := ff.CreateProcess(inputPath)
	if err != nil {
		t.Fatalf("CreateProcess failed: %v", err)
	}
	if pipe == nil {
		t.Fatal("Expected stdout pipe, got nil")
	}

	// 3. Start the process
	doneChan, err := ff.StartProcess()
	if err != nil {
		t.Fatalf("StartProcess failed: %v", err)
	}

	// 4. Read from the pipe to verify data flows
	buf := make([]byte, 1024)
	var output bytes.Buffer

	// We'll read in a loop with a timeout to avoid hanging if ffmpeg freezes
	readDone := make(chan struct{})
	go func() {
		for {
			n, err := pipe.Read(buf)
			if n > 0 {
				output.Write(buf[:n])
			}
			if err != nil {
				if err != io.EOF {
					t.Errorf("Error reading pipe: %v", err)
				}
				break
			}
		}
		close(readDone)
	}()

	// 5. Wait for the process to finish or timeout
	select {
	case procErr := <-doneChan:
		if procErr != nil {
			t.Errorf("FFmpeg process finished with error: %v", procErr)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Test timed out waiting for FFmpeg to finish")
	}

	// Wait for pipe reading to finish
	<-readDone

	// 6. Verify we got some output
	if output.Len() == 0 {
		t.Error("Expected FFmpeg to output some WAV data, got 0 bytes")
	} else {
		t.Logf("Successfully read %d bytes of converted WAV data", output.Len())
	}

	// 7. Verify StopProcess does not panic/error on an already finished process
	if err := ff.StopProcess(); err != nil {
		t.Errorf("StopProcess failed on finished process: %v", err)
	}
}
