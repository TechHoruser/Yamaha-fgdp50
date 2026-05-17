package main

import (
	"context"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"fgdp-looper/desktop/internal/looper"
	"fgdp-looper/desktop/internal/streamdeck"
	"fgdp-looper/desktop/internal/updater"
)

type App struct {
	ctx           context.Context
	looperEngine  *looper.Engine
	streamDeckSrv *streamdeck.Server
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.looperEngine = looper.NewEngine()
	a.streamDeckSrv = streamdeck.NewServer(a.looperEngine)
	go a.streamDeckSrv.Start(":9001")
}

func (a *App) shutdown(ctx context.Context) {
	a.streamDeckSrv.Stop()
}

// --- Wails-bound methods (callable from frontend) ---

func (a *App) GetTracks() []*looper.Track {
	return a.looperEngine.GetTracks()
}

func (a *App) SelectTrack(id int) {
	a.looperEngine.SelectTrack(id)
}

func (a *App) Record() {
	a.looperEngine.Record()
}

func (a *App) Overdub() {
	a.looperEngine.Overdub()
}

func (a *App) Play() {
	a.looperEngine.Play()
}

func (a *App) Stop() {
	a.looperEngine.Stop()
}

func (a *App) Undo() {
	a.looperEngine.Undo()
}

func (a *App) MuteActiveTrack() {
	a.looperEngine.MuteActive()
}

func (a *App) ClearActiveTrack() {
	a.looperEngine.ClearActive()
}

func (a *App) ToggleMetronome() {
	a.looperEngine.ToggleMetronome()
}

func (a *App) PrevTrack()              { a.looperEngine.PrevTrack() }
func (a *App) NextTrack()              { a.looperEngine.NextTrack() }
func (a *App) GetState() looper.State  { return a.looperEngine.GetState() }
func (a *App) GetActiveTrack() int     { return a.looperEngine.GetActiveTrack() }
func (a *App) IsMetronomeActive() bool { return a.looperEngine.IsMetronomeActive() }

// AddTrack appends a new empty track and returns its ID.
func (a *App) AddTrack() int { return a.looperEngine.AddTrack() }

// RemoveTrack deletes the track with the given ID (no-op if it's the last one).
func (a *App) RemoveTrack(id int) { a.looperEngine.RemoveTrack(id) }

// MergeWithBelow combines the active track with the one below (wraps around).
func (a *App) MergeWithBelow() { a.looperEngine.MergeWithBelow() }

// MergeWithAbove combines the active track with the one above (wraps around).
func (a *App) MergeWithAbove() { a.looperEngine.MergeWithAbove() }

// CheckForUpdates queries the GitHub Releases API and returns update info.
func (a *App) CheckForUpdates() (updater.UpdateInfo, error) {
	return updater.Check(Version)
}

// DownloadAndInstallUpdate downloads the NSIS installer and launches it.
// On Windows the current process exits so the installer can replace the binary.
// On macOS the releases page opens in the default browser instead.
func (a *App) DownloadAndInstallUpdate(downloadURL string) error {
	path, err := updater.DownloadInstaller(downloadURL)
	if err != nil {
		return err
	}
	if err := updater.LaunchInstaller(path); err != nil {
		// Fallback for macOS / Linux: open the releases page in the browser.
		wailsruntime.BrowserOpenURL(a.ctx, "https://github.com/TechHoruser/Yamaha-fgdp50/releases/latest")
	}
	return nil
}
