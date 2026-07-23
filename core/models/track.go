package models

import "time"

type TrackSrc int

const (
	DirectURL TrackSrc = iota
	Youtube
	Spotify
	Soundcloud
)

type Track struct {
	Title    string
	Source   TrackSrc
	Url      string
	Duration time.Duration
}
