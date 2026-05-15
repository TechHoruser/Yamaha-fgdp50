package looper

import "testing"

func TestNewEngine_initialState(t *testing.T) {
	e := NewEngine()
	if len(e.tracks) != 4 {
		t.Fatalf("want 4 tracks, got %d", len(e.tracks))
	}
	if e.activeTrack != 0 {
		t.Errorf("want activeTrack=0, got %d", e.activeTrack)
	}
	if e.state != StateIdle {
		t.Errorf("want StateIdle, got %d", e.state)
	}
}

func TestSelectTrack_boundsCheck(t *testing.T) {
	e := NewEngine()
	e.SelectTrack(2)
	if e.activeTrack != 1 {
		t.Errorf("want 1, got %d", e.activeTrack)
	}
	e.SelectTrack(0) // out of range — no change
	if e.activeTrack != 1 {
		t.Errorf("want 1 unchanged, got %d", e.activeTrack)
	}
	e.SelectTrack(5) // out of range — no change
	if e.activeTrack != 1 {
		t.Errorf("want 1 unchanged, got %d", e.activeTrack)
	}
}

func TestPrevNextTrack_wrapAround(t *testing.T) {
	e := NewEngine()
	e.NextTrack()
	if e.activeTrack != 1 {
		t.Errorf("want 1, got %d", e.activeTrack)
	}
	e.PrevTrack()
	if e.activeTrack != 0 {
		t.Errorf("want 0, got %d", e.activeTrack)
	}
	e.PrevTrack() // wrap 0 -> 3
	if e.activeTrack != 3 {
		t.Errorf("want 3 (wrap), got %d", e.activeTrack)
	}
	e.NextTrack() // wrap 3 -> 0
	if e.activeTrack != 0 {
		t.Errorf("want 0 (wrap), got %d", e.activeTrack)
	}
}

func TestRecord_setsStateAndTrack(t *testing.T) {
	e := NewEngine()
	e.Record()
	if e.state != StateRecording {
		t.Errorf("want StateRecording, got %d", e.state)
	}
	if e.tracks[0].State != TrackRecording {
		t.Errorf("want TrackRecording on track 0")
	}
}

func TestPlay_togglesPlayIdle(t *testing.T) {
	e := NewEngine()
	e.Play()
	if e.state != StatePlaying {
		t.Errorf("want StatePlaying")
	}
	e.Play()
	if e.state != StateIdle {
		t.Errorf("want StateIdle after second Play")
	}
}

func TestStop_resetsAll(t *testing.T) {
	e := NewEngine()
	e.Record()
	e.Stop()
	if e.state != StateIdle {
		t.Errorf("want StateIdle after Stop")
	}
}

func TestUndoAfterRecord(t *testing.T) {
	e := NewEngine()
	e.Record()
	e.Stop()
	if !e.tracks[0].HasLoop {
		t.Fatal("want hasLoop=true after record+stop")
	}
	e.Undo()
	if e.tracks[0].HasLoop {
		t.Errorf("want hasLoop=false after Undo")
	}
}

func TestMuteActive_toggles(t *testing.T) {
	e := NewEngine()
	e.MuteActive()
	if !e.tracks[0].Muted {
		t.Errorf("want muted=true")
	}
	e.MuteActive()
	if e.tracks[0].Muted {
		t.Errorf("want muted=false")
	}
}

func TestClearActive_clearsLoop(t *testing.T) {
	e := NewEngine()
	e.Record()
	e.Stop()
	e.MuteActive()
	e.ClearActive()
	if e.tracks[0].HasLoop || e.tracks[0].Muted {
		t.Errorf("want cleared track")
	}
}

func TestToggleMetronome(t *testing.T) {
	e := NewEngine()
	e.ToggleMetronome()
	if !e.metronome {
		t.Errorf("want metronome=true")
	}
	e.ToggleMetronome()
	if e.metronome {
		t.Errorf("want metronome=false")
	}
}

func TestGetState_returnsEngineState(t *testing.T) {
	e := NewEngine()
	if e.GetState() != StateIdle {
		t.Errorf("want StateIdle")
	}
	e.Play()
	if e.GetState() != StatePlaying {
		t.Errorf("want StatePlaying")
	}
}

func TestIsMetronomeActive(t *testing.T) {
	e := NewEngine()
	if e.IsMetronomeActive() {
		t.Errorf("want false initially")
	}
	e.ToggleMetronome()
	if !e.IsMetronomeActive() {
		t.Errorf("want true after toggle")
	}
}
