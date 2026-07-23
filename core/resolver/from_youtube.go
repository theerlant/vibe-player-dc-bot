package resolver

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strconv"
	"strings"
	"time"
	"vibe-bot/core/models"
)

// Execute and return output from YT-DLP with default parameter.
func execYtdlp(query string, args ...string) ([]byte, error) {
	params := []string{query}
	params = append(params, args...)
	params = append(params, defaultParams...)

	return exec.Command(ytdlpPath, params...).Output()
}

func SearchYoutube(query string, page uint) ([]models.Track, error) {
	const limit = 5

	out, err := execYtdlp(fmt.Sprintf("ytsearch5:%s", query))
	if err != nil {
		return nil, fmt.Errorf("Failed executing youtube search query: %w", err)
	}

	tracks := make([]models.Track, 0)
	decoder := json.NewDecoder(bytes.NewReader(out))

	for {
		var entry models.YtdlpEntry
		err := decoder.Decode(&entry)

		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println("Error when parsing output", err, "\nRaw output:\n", string(out))
		} else {
			tracks = append(tracks, models.Track{
				Title:    entry.Title,
				Source:   models.Youtube,
				Url:      entry.Url,
				Duration: time.Duration(entry.DurationSec) * time.Second,
			})
		}
	}

	return tracks, nil
}

func GetTrackFromYoutube(url string) (models.Track, error) {
	out, err := execYtdlp(url)
	if err != nil {
		return models.Track{}, fmt.Errorf("Failed executing youtube url query: %w", err)
	}

	decoder := json.NewDecoder(bytes.NewReader(out))

	var entry models.YtdlpEntry
	err = decoder.Decode(&entry)

	if err != nil {
		return models.Track{}, fmt.Errorf("Error when parsing output, %v", err)
	}

	track := models.Track{
		Title:    entry.Title,
		Source:   models.Youtube,
		Url:      url, // Append url because ytdlp don't return it when youtube link is being queried.
		Duration: time.Duration(entry.DurationSec) * time.Second,
	}
	return track, nil
}

func GetPlaylistFromYoutube(url string, limits ...int) ([]models.Track, error) {
	// Get playlist count
	params := []string{
		"--extractor-args", "youtube:player-client=ios",
		"--flat-playlist",
		"-I0",
		"-O", "playlist:playlist_count",
		url,
	}

	out, err := exec.Command(ytdlpPath, params...).Output()
	if err != nil {
		return nil, fmt.Errorf("Failed executing youtube playlist query: %w", err)
	}

	// Convert byte to int to get playlist length
	count, err := strconv.Atoi(strings.TrimSpace(string(out)))
	if err != nil {
		return nil, fmt.Errorf("Error during playlist length conversion: %w", err)
	}

	startLimit := 1
	endLimit := count

	if len(limits) > 0 && limits[0] > 0 {
		startLimit = limits[0]
	}
	if len(limits) > 1 && limits[1] > 0 {
		endLimit = limits[1]
	}
	if endLimit > count {
		endLimit = count
	}

	tracks := make([]models.Track, 0)

	current := startLimit
	for current <= endLimit {
		end := min(current+9, endLimit)

		out, err := execYtdlp(url, "--playlist-start", fmt.Sprint(current), "--playlist-end", fmt.Sprint(end))
		if err != nil {
			fmt.Printf("Failed executing youtube url query: %v", err) // Silently error ATM
			break
		}

		decoder := json.NewDecoder(bytes.NewReader(out))

		for {
			var entry models.YtdlpEntry
			err = decoder.Decode(&entry)

			if err == io.EOF {
				break
			}

			if err != nil {
				fmt.Println("Error when parsing output", err, "\nRaw output:\n", string(out)) // Silently error ATM
			} else {
				tracks = append(tracks, models.Track{
					Title:    entry.Title,
					Source:   models.Youtube,
					Url:      entry.Url,
					Duration: time.Duration(entry.DurationSec) * time.Second,
				})
			}
		}

		current = end + 1
	}

	return tracks, nil
}

func FetchStreamYoutube(url string) (string, error) {
	params := []string{
		"--ignore-config",
		"-f", "ba[abr<=256]",
		"--get-url",
		url,
	}

	out, err := exec.Command(ytdlpPath, params...).Output()
	if err != nil {
		return "", fmt.Errorf("Failed executing youtube playlist query: %w", err)
	}

	return string(out), nil
}
