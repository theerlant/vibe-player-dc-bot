package models

type YtdlpEntry struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Url         string `json:"url"`
	DurationSec int    `json:"duration"`
}
