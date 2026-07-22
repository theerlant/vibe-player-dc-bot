package streamer

import "math"

// PercentToLinearVolume converts a linear 0-100 percentage
// into a logarithmic volume value for beep's effects.Volume (Base 2).
func PercentToLinearVolume(percentage float64) float64 {
	if percentage <= 0 {
		return -100.0 
	}
	
	// Convert 100% -> 1.0 multiplier, 50% -> 0.5 multiplier
	multiplier := percentage / 100.0
	
	// Since beep multiplier = Base ^ Volume, and Base = 2,
	// Volume = log2(multiplier)
	return math.Log2(multiplier)
}

func generateSilence(samples [][2]float64) (n int, ok bool) {
	for i := range samples {
		samples[i] = [2]float64{0, 0} // Stream silence if no streamer
	}
	return len(samples), true
}

func moveTowards(current float64, target float64, delta float64) float64 {
	if (math.Abs(target - current) <= delta) {
		return target
	}

	if (math.Signbit(target - current)) {
		return current + -delta
	} else {
		return current + delta
	}
}