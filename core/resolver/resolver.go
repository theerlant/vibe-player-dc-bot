package resolver

import (
	"errors"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

var (
	ytdlpPath  string
	spotdlPath string

	ytSupported bool
	scSupported bool
	spSupported bool
)

func init() {
	log.Println("---- [RESOLVER INITIALIZATION START] ----")

	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)

	// Find and test YT-DLP as a main requirement for the resolver to works.
	ytdlpName := "yt-dlp"
	if runtime.GOOS == "windows" {
		ytdlpName = "yt-dlp.exe"
	}

	var binPath string
	cwd, _ := os.Getwd()

	pathsToTry := []string{
		filepath.Join(exPath, "core", "resolver", "bin"), // Relative to executable
		filepath.Join(cwd, "core", "resolver", "bin"),    // Relative to project root
		filepath.Join(cwd, "bin"),                        // Relative to core/resolver
	}

	for _, p := range pathsToTry {
		if _, err := os.Stat(filepath.Join(p, ytdlpName)); err == nil {
			binPath = p
			break
		}
	}

	if binPath == "" {
		binPath = pathsToTry[0] // fallback for error message
	}

	ytdlpPath = filepath.Join(binPath, ytdlpName)

	if _, err := os.Stat(ytdlpPath); errors.Is(err, os.ErrNotExist) {
		log.Fatalf("Cannot find YT-DLP on %s which is required for playback!", ytdlpPath)
	}

	out, err := exec.Command(ytdlpPath, "--version").Output()
	if err != nil {
		log.Fatalf("YT-DLP returning error when checking: %v. Cannot continue as this is required for playback!\n", err)
	}

	log.Printf("YT-DLP version: %s", out)
	ytSupported = true
	scSupported = true

	// Optional: Find and test spotdl as a metadata parser for spotify url.
	spotdlName := "spotdl"
	if runtime.GOOS == "windows" {
		spotdlName = "spotdl.exe"
	}

	spotdlPath = filepath.Join(binPath, spotdlName)

	if _, err := os.Stat(spotdlPath); errors.Is(err, os.ErrNotExist) {
		log.Printf("Spot-DL is not found in %s. Spotify url won't be able to be used\n", spotdlPath)
	} else {
		out, err = exec.Command(spotdlPath, "--version").Output()
		if err != nil {
			log.Printf("Spot-DL returning error when checking: %v. Spotify url won't be able to be used\n", err)
		} else {
			log.Printf("Spot-DL version: %s", out)
			spSupported = true
		}
	}

	sources := "Youtube" // Youtube is always available as yt-dlp is the main requirement
	if scSupported {
		sources += ", Soundcloud" // In case yt-dlp changes
	}
	if spSupported {
		sources += ", Spotify"
	}
	log.Printf("Supported sources: %s\n", sources)

	log.Println("---- [RESOLVER INITIALIZATION END] ----")

}
