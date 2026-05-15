package looper

import "sync"

type State int

const (
	StateIdle State = iota
	StatePlaying
	StateRecording
	StateOverdubbing
)

type Engine struct {
	mu          sync.RWMutex
	tracks      []*Track
	activeTrack int
	state       State
	metronome   bool
}

func NewEngine() *Engine {
	tracks := make([]*Track, 4)
	for i := range tracks {
		tracks[i] = NewTrack(i + 1)
	}
	return &Engine{
		tracks:      tracks,
		activeTrack: 0,
	}
}

func (e *Engine) GetTracks() []*Track {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.tracks
}

func (e *Engine) SelectTrack(id int) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if id >= 1 && id <= len(e.tracks) {
		e.activeTrack = id - 1
	}
}

func (e *Engine) Record() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.state = StateRecording
	e.tracks[e.activeTrack].StartRecording()
}

func (e *Engine) Overdub() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.state = StateOverdubbing
	e.tracks[e.activeTrack].StartOverdub()
}

func (e *Engine) Play() {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.state == StatePlaying {
		e.state = StateIdle
	} else {
		e.state = StatePlaying
	}
}

func (e *Engine) Stop() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.state = StateIdle
	for _, t := range e.tracks {
		t.Stop()
	}
}

func (e *Engine) Undo() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.tracks[e.activeTrack].Undo()
}

func (e *Engine) MuteActive() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.tracks[e.activeTrack].ToggleMute()
}

func (e *Engine) ClearActive() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.tracks[e.activeTrack].Clear()
}

func (e *Engine) ToggleMetronome() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.metronome = !e.metronome
}
