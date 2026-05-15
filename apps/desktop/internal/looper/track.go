package looper

type TrackState int

const (
	TrackIdle TrackState = iota
	TrackRecording
	TrackPlaying
	TrackOverdubbing
	TrackMuted
)

type Track struct {
	ID      int        `json:"id"`
	State   TrackState `json:"state"`
	Muted   bool       `json:"muted"`
	HasLoop bool       `json:"hasLoop"`
}

func NewTrack(id int) *Track {
	return &Track{ID: id, State: TrackIdle}
}

func (t *Track) StartRecording() {
	t.State = TrackRecording
}

func (t *Track) StartOverdub() {
	if t.HasLoop {
		t.State = TrackOverdubbing
	}
}

func (t *Track) Stop() {
	if t.State == TrackRecording {
		t.HasLoop = true
	}
	t.State = TrackIdle
}

func (t *Track) ToggleMute() {
	t.Muted = !t.Muted
}

func (t *Track) Clear() {
	t.State = TrackIdle
	t.HasLoop = false
	t.Muted = false
}

func (t *Track) Undo() {
	if t.HasLoop {
		t.HasLoop = false
		t.State = TrackIdle
	}
}
