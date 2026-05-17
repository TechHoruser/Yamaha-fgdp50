package looper

import "sync"

type State int

const (
	StateIdle State = iota
	StatePlaying
	StateRecording
	StateOverdubbing
)

// DefaultInitialTracks is how many empty tracks the engine starts with.
// Tracks can be added/removed at runtime — there is no fixed upper bound.
const DefaultInitialTracks = 4

type Engine struct {
	mu          sync.RWMutex
	tracks      []*Track
	nextID      int
	activeTrack int
	state       State
	metronome   bool
}

func NewEngine() *Engine {
	tracks := make([]*Track, DefaultInitialTracks)
	for i := range tracks {
		tracks[i] = NewTrack(i + 1)
	}
	return &Engine{
		tracks:      tracks,
		nextID:      DefaultInitialTracks + 1,
		activeTrack: 0,
	}
}

// AddTrack appends a new empty track and returns its ID. Track IDs are unique
// and monotonically increasing for the lifetime of the engine, so removing
// a track in the middle does not reshuffle the remaining IDs.
func (e *Engine) AddTrack() int {
	e.mu.Lock()
	defer e.mu.Unlock()
	id := e.nextID
	e.nextID++
	e.tracks = append(e.tracks, NewTrack(id))
	return id
}

// RemoveTrack deletes the track with the given ID. If the active track is
// removed, the active pointer falls back to the previous track (clamped to 0).
// The last remaining track cannot be removed.
func (e *Engine) RemoveTrack(id int) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if len(e.tracks) <= 1 {
		return
	}
	idx := -1
	for i, t := range e.tracks {
		if t.ID == id {
			idx = i
			break
		}
	}
	if idx < 0 {
		return
	}
	e.tracks = append(e.tracks[:idx], e.tracks[idx+1:]...)
	if e.activeTrack >= len(e.tracks) {
		e.activeTrack = len(e.tracks) - 1
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
	for i, t := range e.tracks {
		if t.ID == id {
			e.activeTrack = i
			return
		}
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

func (e *Engine) PrevTrack() {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.activeTrack == 0 {
		e.activeTrack = len(e.tracks) - 1
	} else {
		e.activeTrack--
	}
}

func (e *Engine) NextTrack() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.activeTrack = (e.activeTrack + 1) % len(e.tracks)
}

// MergeWithBelow combines the active track's loop with the track below it (wrapping
// around), marks the active track as having a loop, and clears the source track.
// This frees a track slot without losing recorded content.
func (e *Engine) MergeWithBelow() {
	e.mu.Lock()
	defer e.mu.Unlock()
	if len(e.tracks) < 2 {
		return
	}
	below := (e.activeTrack + 1) % len(e.tracks)
	active := e.tracks[e.activeTrack]
	src := e.tracks[below]
	if active.HasLoop || src.HasLoop {
		active.HasLoop = true
		active.State = TrackIdle
		src.Clear()
	}
}

// MergeWithAbove is the mirror of MergeWithBelow: combines the active track's
// loop with the track above it (wrapping around to the last track), marks the
// active track as having a loop, and clears the source track.
func (e *Engine) MergeWithAbove() {
	e.mu.Lock()
	defer e.mu.Unlock()
	if len(e.tracks) < 2 {
		return
	}
	above := (e.activeTrack - 1 + len(e.tracks)) % len(e.tracks)
	active := e.tracks[e.activeTrack]
	src := e.tracks[above]
	if active.HasLoop || src.HasLoop {
		active.HasLoop = true
		active.State = TrackIdle
		src.Clear()
	}
}

func (e *Engine) GetState() State {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.state
}

func (e *Engine) GetActiveTrack() int {
	e.mu.RLock()
	defer e.mu.RUnlock()
	if e.activeTrack < 0 || e.activeTrack >= len(e.tracks) {
		return 0
	}
	return e.tracks[e.activeTrack].ID
}

func (e *Engine) IsMetronomeActive() bool {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.metronome
}
