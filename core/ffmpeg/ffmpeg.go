package ffmpeg

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type FFMpeg struct {
	cmd           *exec.Cmd
	ffmpegPath    string
	defaultParams []string
}

func New() (*FFMpeg, error) {
	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)

	binaryName := "ffmpeg"
	if runtime.GOOS == "windows" {
		binaryName = "ffmpeg.exe"
	}

	var ffmpegPath string
	cwd, _ := os.Getwd()

	pathsToTry := []string{
		filepath.Join(exPath, "core", "ffmpeg", "bin", binaryName),
		filepath.Join(cwd, "core", "ffmpeg", "bin", binaryName),
		filepath.Join(cwd, "bin", binaryName),
	}

	for _, p := range pathsToTry {
		if _, err := os.Stat(p); err == nil {
			ffmpegPath = p
			break
		}
	}

	if ffmpegPath == "" {
		// Fallback to checking the system PATH just in case
		path, err := exec.LookPath(binaryName)
		if err != nil {
			return nil, fmt.Errorf("FFmpeg not found at %s or in system PATH", pathsToTry[0])
		}
		ffmpegPath = path
	}

	ffmpeg := FFMpeg{
		cmd:        nil,
		ffmpegPath: ffmpegPath,
		defaultParams: []string{
			"-user_agent", "\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36\"",
			"-headers", "\"Referer: https://www.youtube.com/\"",
			"-hide_banner",
			"-loglevel", "error",
			"-f", "wav",
			"-ar", "48000",
			"-ac", "2",
		},
	}

	return &ffmpeg, nil
}

// Create a ffmpeg process and returns the Stdout to pipe
func (ffmpeg *FFMpeg) CreateProcess(input string) (io.ReadCloser, error) {
	args := append([]string{"-i", input}, ffmpeg.defaultParams...)
	args = append(args, "pipe:1")
	cmd := exec.Command(
		ffmpeg.ffmpegPath,
		args...,
	)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("Failed creating command stdout pipe: %v", err)
	}

	ffmpeg.cmd = cmd

	return stdoutPipe, nil
}

// StartProcess starts FFmpeg and returns a channel that will receive an error when it finishes
func (ffmpeg *FFMpeg) StartProcess() (<-chan error, error) {
	ffmpeg.cmd.Stderr = os.Stderr

	if err := ffmpeg.cmd.Start(); err != nil {
		return nil, fmt.Errorf("Failed to start ffmpeg command: %v", err)
	}

	done := make(chan error, 1)
	go func() {
		// Wait blocks until the command completes.
		err := ffmpeg.cmd.Wait()
		if err != nil {
			done <- fmt.Errorf("FFmpeg finished with error: %v", err)
		} else {
			done <- nil
		}
		close(done)
	}()

	return done, nil
}

func (ffmpeg *FFMpeg) StopProcess() error {
	if ffmpeg.cmd != nil && ffmpeg.cmd.Process != nil {
		err := ffmpeg.cmd.Process.Kill()
		// If the process is already dead, Windows often returns "invalid argument"
		// and Unix returns os.ErrProcessDone. We can safely ignore these.
		if err != nil && err.Error() != "os: process already finished" && err.Error() != "invalid argument" {
			return err
		}
	}
	return nil
}
