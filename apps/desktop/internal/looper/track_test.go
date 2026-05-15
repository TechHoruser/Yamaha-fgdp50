package looper

import "testing"

func TestNewTrack(t *testing.T) {
	tr := NewTrack(3)
	if tr.ID != 3 || tr.State != TrackIdle || tr.Muted || tr.HasLoop {
		t.Errorf("unexpected initial state: %+v", tr)
	}
}

func TestStartRecording(t *testing.T) {
	tr := NewTrack(1)
	tr.StartRecording()
	if tr.State != TrackRecording {
		t.Errorf("want TrackRecording, got %d", tr.State)
	}
}

func TestStartOverdub_requiresExistingLoop(t *testing.T) {
	tr := NewTrack(1)
	tr.StartOverdub()
	if tr.State == TrackOverdubbing {
		t.Errorf("should not overdub without a loop")
	}
	tr.StartRecording()
	tr.Stop()
	tr.StartOverdub()
	if tr.State != TrackOverdubbing {
		t.Errorf("want TrackOverdubbing with existing loop")
	}
}

func TestStop_createsLoopOnlyFromRecording(t *testing.T) {
	tr := NewTrack(1)
	tr.StartRecording()
	tr.Stop()
	if tr.State != TrackIdle {
		t.Errorf("want TrackIdle after Stop")
	}
	if !tr.HasLoop {
		t.Errorf("want hasLoop=true after recording+stop")
	}

	tr2 := NewTrack(2)
	tr2.Stop()
	if tr2.HasLoop {
		t.Errorf("want hasLoop=false when stopped without recording")
	}
}

func TestToggleMute(t *testing.T) {
	tr := NewTrack(1)
	tr.ToggleMute()
	if !tr.Muted {
		t.Errorf("want muted=true")
	}
	tr.ToggleMute()
	if tr.Muted {
		t.Errorf("want muted=false")
	}
}

func TestClear_resetsAll(t *testing.T) {
	tr := NewTrack(1)
	tr.StartRecording()
	tr.Stop()
	tr.ToggleMute()
	tr.Clear()
	if tr.State != TrackIdle || tr.HasLoop || tr.Muted {
		t.Errorf("want fully cleared track, got %+v", tr)
	}
}

func TestUndo_removesLoop(t *testing.T) {
	tr := NewTrack(1)
	tr.StartRecording()
	tr.Stop()
	tr.Undo()
	if tr.HasLoop || tr.State != TrackIdle {
		t.Errorf("want loop removed by Undo")
	}

	tr2 := NewTrack(2)
	tr2.Undo() // no-op on empty track
	if tr2.State != TrackIdle {
		t.Errorf("Undo on empty track should be no-op")
	}
}
