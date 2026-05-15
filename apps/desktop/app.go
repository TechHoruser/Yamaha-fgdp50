package main

import (
	"context"

	"fgdp-looper/desktop/internal/looper"
	"fgdp-looper/desktop/internal/streamdeck"
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
