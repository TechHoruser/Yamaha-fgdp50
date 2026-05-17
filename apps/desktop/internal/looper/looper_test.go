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

func TestMergeWithBelow_combinesLoopsAndClearsSource(t *testing.T) {
	e := NewEngine()

	// Record on track 1 (index 0) and track 2 (index 1).
	e.SelectTrack(1)
	e.Record()
	e.Stop()
	e.SelectTrack(2)
	e.Record()
	e.Stop()

	// Merge track 1 (active) with track 2 (below).
	e.SelectTrack(1)
	e.MergeWithBelow()

	if !e.tracks[0].HasLoop {
		t.Errorf("want active track to keep hasLoop=true after merge")
	}
	if e.tracks[1].HasLoop || e.tracks[1].Muted || e.tracks[1].State != TrackIdle {
		t.Errorf("want below track cleared after merge, got %+v", e.tracks[1])
	}
}

func TestMergeWithBelow_noOpWhenBothEmpty(t *testing.T) {
	e := NewEngine()
	e.MergeWithBelow()
	if e.tracks[0].HasLoop {
		t.Errorf("want no loop created when both tracks are empty")
	}
}

func TestMergeWithBelow_wrapsAroundLastTrack(t *testing.T) {
	e := NewEngine()
	// Give track 4 (last) a loop, then merge with track 1 (wraps).
	e.SelectTrack(4)
	e.Record()
	e.Stop()
	e.MergeWithBelow()

	if !e.tracks[3].HasLoop {
		t.Errorf("want last track to keep hasLoop=true after merge")
	}
	if e.tracks[0].HasLoop {
		t.Errorf("want first track (below, was empty) to remain empty")
	}
}

func TestMergeWithAbove_combinesLoopsAndClearsSource(t *testing.T) {
	e := NewEngine()
	e.SelectTrack(2)
	e.Record()
	e.Stop()
	e.SelectTrack(3)
	e.Record()
	e.Stop()

	// Active=track 3, merge with track 2 (above).
	e.SelectTrack(3)
	e.MergeWithAbove()

	if !e.tracks[2].HasLoop {
		t.Errorf("want active track to keep hasLoop=true after merge")
	}
	if e.tracks[1].HasLoop {
		t.Errorf("want above track cleared after merge")
	}
}

func TestMergeWithAbove_wrapsAroundFirstTrack(t *testing.T) {
	e := NewEngine()
	// Give track 1 (first) a loop, then merge with track 4 above (wraps).
	e.SelectTrack(1)
	e.Record()
	e.Stop()
	e.MergeWithAbove()

	if !e.tracks[0].HasLoop {
		t.Errorf("want first track to keep hasLoop=true after merge")
	}
	if e.tracks[3].HasLoop {
		t.Errorf("want last track (above, was empty) to remain empty")
	}
}

func TestAddTrack_appendsAndReturnsID(t *testing.T) {
	e := NewEngine()
	id := e.AddTrack()
	if id != 5 {
		t.Errorf("want id=5 (DefaultInitialTracks+1), got %d", id)
	}
	if len(e.tracks) != 5 {
		t.Errorf("want 5 tracks, got %d", len(e.tracks))
	}
	id2 := e.AddTrack()
	if id2 != 6 {
		t.Errorf("want id=6, got %d", id2)
	}
	if len(e.tracks) != 6 {
		t.Errorf("want 6 tracks, got %d", len(e.tracks))
	}
}

func TestAddTrack_idsRemainUniqueAfterRemove(t *testing.T) {
	e := NewEngine()
	// Add a 5th track, remove it, add another. The new one should NOT reuse id 5.
	e.AddTrack()      // id 5
	e.RemoveTrack(5)  // gone
	id := e.AddTrack()
	if id != 6 {
		t.Errorf("want id=6 (monotonic), got %d", id)
	}
}

func TestRemoveTrack_removesByID(t *testing.T) {
	e := NewEngine()
	e.RemoveTrack(2)
	if len(e.tracks) != 3 {
		t.Errorf("want 3 tracks after remove, got %d", len(e.tracks))
	}
	for _, tr := range e.tracks {
		if tr.ID == 2 {
			t.Errorf("track id=2 should have been removed")
		}
	}
}

func TestRemoveTrack_refusesLastTrack(t *testing.T) {
	e := NewEngine()
	e.RemoveTrack(1)
	e.RemoveTrack(2)
	e.RemoveTrack(3)
	// One left; refuse to remove it.
	e.RemoveTrack(4)
	if len(e.tracks) != 1 {
		t.Errorf("want at least 1 track left, got %d", len(e.tracks))
	}
}

func TestRemoveTrack_clampsActiveTrack(t *testing.T) {
	e := NewEngine()
	e.SelectTrack(4)
	e.RemoveTrack(4)
	// Active should have fallen back to the new last track (id 3).
	if e.GetActiveTrack() != 3 {
		t.Errorf("want active=3 after removing last, got %d", e.GetActiveTrack())
	}
}

func TestSelectTrack_byActualID(t *testing.T) {
	e := NewEngine()
	// Remove track 2 and add a new one (id 5). Selecting by ID, not index.
	e.RemoveTrack(2)
	e.AddTrack() // id 5
	e.SelectTrack(5)
	if e.GetActiveTrack() != 5 {
		t.Errorf("want active=5 after SelectTrack(5), got %d", e.GetActiveTrack())
	}
}
