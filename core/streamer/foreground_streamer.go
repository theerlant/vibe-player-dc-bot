package streamer

import (
	"fmt"
	"io"
	"math"
	"sync"

	"github.com/gopxl/beep/v2"
	"github.com/gopxl/beep/v2/effects"
	"github.com/gopxl/beep/v2/wav"
)

type FStreamer struct {
	mu sync.Mutex
	stdin io.ReadCloser
	
	ResampleRate float64
	Volume float64
	
	streamer beep.Streamer
	resampler *beep.Resampler
	output effects.Volume
}

func NewFStreamer() *FStreamer {
	s := FStreamer {
		mu: sync.Mutex{},
		stdin: nil,
		ResampleRate: 1.0,
		Volume: 0.0,
	}

	return &s
}

func (s *FStreamer) Pipe(stdin io.ReadCloser) error {
	streamer, _, err := wav.Decode(stdin)

	if (err != nil) {
		return fmt.Errorf("Failed to decode WAV %w", err)
	}

	s.streamer = streamer
	s.resampler = beep.ResampleRatio(2, s.ResampleRate, streamer)
	s.output = effects.Volume{
		Streamer: s.resampler,
		Base: 2,
		Volume: s.Volume,
		Silent: false,
	}
	
	return nil
}

func (s *FStreamer) SetVolume(volumePercent float64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	volumePercent = math.Min(math.Max(0, volumePercent), 100)

	s.Volume = PercentToLinearVolume(volumePercent)
	s.output.Volume = s.Volume
}

func (s *FStreamer) SetResampleRate(ratio float64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ratio = math.Min(math.Max(0.1, ratio), 2.0)

	s.ResampleRate = ratio

	if (s.resampler != nil) {
		s.resampler.SetRatio(ratio)
	}
}

// Clear stops the current audio and forces the streamer to output silence
func (s *FStreamer) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.streamer = nil
	s.resampler = nil
	s.output.Streamer = nil
}

// A non-blocking Stream function that will always return a buffer regardless of input availability
func (s *FStreamer) Stream(samples [][2]float64) (n int, ok bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.output.Streamer == nil {
		// No streamer attached
		return generateSilence(samples)
	}

	n, ok = s.output.Stream(samples)

	if (s.output.Volume != s.Volume) {
		deltaSec := float64(len(samples)) / 48000.0 // sample rate
		const speed = 2.0

		s.output.Volume = moveTowards(s.output.Volume, s.Volume, deltaSec * speed)
	}

	if !ok {
		// song is finished
		s.streamer = nil
		s.resampler = nil
		s.output.Streamer = nil

		return generateSilence(samples)
	}

	return n, true
}

// Pass final output error but not when there's no active streamer (which in this case will always return error so we ignore it)
func (s *FStreamer) Err() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.output.Streamer == nil {
		return nil
	}

	return s.output.Err()
}