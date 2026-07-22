package streamer

import (
	"fmt"
	"math"
	"os"
	"testing"
	"time"

	"github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/speaker"
	"github.com/gopxl/beep/v2/wav"
)

// sineStreamer generates a pure math sine wave tone
type sineStreamer struct {
	freq       float64
	pos        float64
	sampleRate beep.SampleRate
}

func (s *sineStreamer) Stream(samples [][2]float64) (n int, ok bool) {
	for i := range samples {
		val := math.Sin(s.pos * 2 * math.Pi * s.freq)
		// Reduce amplitude to 30% so we don't blast your ears
		samples[i][0] = val * 0.3
		samples[i][1] = val * 0.3
		s.pos += 1.0 / float64(s.sampleRate)
	}
	return len(samples), true
}

func (s *sineStreamer) Err() error { return nil }

func TestFStreamer_Audible(t *testing.T) {
	// This format matches exactly what Discord (and our FFmpeg command) expects
	format := beep.Format{
		SampleRate:  48000,
		NumChannels: 2,
		Precision:   2,
	}

	// Generate 8 seconds of 440Hz Sine Wave
	sineA := &sineStreamer{freq: 440, sampleRate: format.SampleRate}
	// Take only 8 seconds worth of audio so it doesn't play forever
	limitA := beep.Take(format.SampleRate.N(time.Second*8), sineA)

	// Generate second audio for input switching test
	sineB := &sineStreamer{freq: 880, sampleRate: format.SampleRate}
	limitB := beep.Take(format.SampleRate.N(time.Second*3), sineB)

	// We need to write it to a temp file because wav.Encode requires a WriteSeeker
	tempFileA, err := os.CreateTemp("", "test_sine_*.wav")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	tempFileB, err := os.CreateTemp("", "test_sine_*.wav")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}

	 // Clean up
	defer os.Remove(tempFileA.Name())
	defer os.Remove(tempFileB.Name())

	if err := wav.Encode(tempFileA, limitA, format); err != nil {
		t.Fatalf("Failed to encode wav: %v", err)
	}
	if err := wav.Encode(tempFileB, limitB, format); err != nil {
		t.Fatalf("Failed to encode wav: %v", err)
	}

	// Initialize the physical speaker
	// NOTE: Require actual speaker!
	err = speaker.Init(format.SampleRate, format.SampleRate.N(time.Second/10))
	if err != nil {
		t.Fatalf("Failed to init speaker (do you have audio drivers?): %v", err)
	}

	// Setup our FStreamer and pipe the temporary WAV file into it
	fs := NewFStreamer()
	// Set initial volume to 100% so we can hear it
	fs.SetVolume(100.0) 

	tempFileA.Seek(0, 0)
	tempFileB.Seek(0, 0)
	
	if err := fs.Pipe(tempFileA); err != nil {
		t.Fatalf("Failed to pipe: %v", err)
	}

	fmt.Println("\n=== AUDIO TEST STARTING ===")

	// This probably can be tested by comparing frequency / intensity of the tone from the output buffer?
	fmt.Println("This test requires hearing the sound output manually.")
	// Start playing in the background
	speaker.Play(fs)

	fmt.Println("You should hear a pure 440Hz tone.")
	time.Sleep(2 * time.Second)

	fmt.Println("Increasing speed/pitch to 1.5x... (Tone should get higher)")
	fs.SetResampleRate(1.5)
	time.Sleep(2 * time.Second)

	fmt.Println("Slowing speed/pitch to 0.5x... (Tone should get lower)")
	fs.SetResampleRate(0.5)
	time.Sleep(2 * time.Second)
    
	fmt.Println("Testing Silence (Clearing track)... You should hear absolutely nothing for 3 seconds.")
	fs.Clear()
	time.Sleep(2 * time.Second)

	fmt.Println("Switching audio input. You should hear a pure 880Hz tone.")
	fs.SetResampleRate(1.0)
	if err := fs.Pipe(tempFileB); err != nil {
		t.Fatalf("Failed to pipe: %v", err)
	}
	time.Sleep(2 * time.Second)
	
	// Fade out over and wait for 3 seconds
	fs.SetVolume(20)
	fmt.Println("Reducing volume to 20%%")
	time.Sleep(3 * time.Second)
	
	fmt.Println("=== AUDIO TEST FINISHED ===")
}
