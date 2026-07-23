package resolver

import (
	"strings"
	"testing"
)

func TestSearchYoutube(t *testing.T) {
	tracks, err := SearchYoutube("song", 1)
	if err != nil {
		t.Fatalf("SearchYoutube failed: %v", err)
	}

	if len(tracks) == 0 {
		t.Fatalf("Expected tracks from search, got 0")
	}

	firstTrack := tracks[0]
	if firstTrack.Url == "" {
		t.Fatalf("Expected first track url to not be empty")
	}

	// Test GetTrackFromYoutube with the first track URL
	track, err := GetTrackFromYoutube(firstTrack.Url)
	if err != nil {
		t.Fatalf("GetTrackFromYoutube failed: %v", err)
	}

	if track.Title == "" {
		t.Errorf("Expected track title to not be empty")
	}
}

func TestGetPlaylistFromYoutube(t *testing.T) {
	playlistUrl := "https://www.youtube.com/playlist?list=PLDIoUOhQQPlWm_njQtKkNIk5RYSGgzomm"
	tracks, err := GetPlaylistFromYoutube(playlistUrl, 5, 6)
	if err != nil {
		t.Fatalf("GetPlaylistFromYoutube failed: %v", err)
	}

	if len(tracks) != 2 {
		t.Fatalf("Expected exactly 2 tracks in bounded playlist, got %d", len(tracks))
	}

	expectedUrls := []string{
		"https://www.youtube.com/watch?v=bhoybya39QU",
		"https://www.youtube.com/watch?v=aAXLhvrfaT8",
	}

	for i, expectedUrl := range expectedUrls {
		if tracks[i].Url != expectedUrl {
			t.Errorf("Expected track %d URL to be %s, got %s", i, expectedUrl, tracks[i].Url)
		}
		if tracks[i].Title == "" {
			t.Errorf("Expected track %d to have title, got empty", i)
		}
	}
}

func TestFetchStreamYoutube(t *testing.T) {
	url := "https://www.youtube.com/watch?v=bhoybya39QU"
	streamUrl, err := FetchStreamYoutube(url)
	if err != nil {
		t.Fatalf("FetchStreamYoutube failed: %v", err)
	}

	if streamUrl == "" {
		t.Fatalf("Expected stream URL to not be empty")
	}

	streamUrl = strings.TrimSpace(streamUrl)

	if !strings.HasPrefix(streamUrl, "http") {
		t.Errorf("Expected stream URL to start with http, got: %s", streamUrl)
	}
}
