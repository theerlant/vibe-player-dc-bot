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
	ytdlpPath string

	ytSupported bool
	scSupported bool
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

	log.Println("---- [RESOLVER INITIALIZATION END] ----")

}
