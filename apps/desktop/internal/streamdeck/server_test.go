package streamdeck

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"fgdp-looper/desktop/internal/looper"
)

func newTestServer() *Server {
	return NewServer(looper.NewEngine())
}

func postCommand(t *testing.T, s *Server, cmd Command) *httptest.ResponseRecorder {
	t.Helper()
	body, _ := json.Marshal(cmd)
	req := httptest.NewRequest(http.MethodPost, "/command", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	s.handleCommand(w, req)
	return w
}

func TestHandleCommand_validAction(t *testing.T) {
	s := newTestServer()
	w := postCommand(t, s, Command{Action: ActionPlayPause})
	if w.Code != http.StatusNoContent {
		t.Errorf("want 204, got %d", w.Code)
	}
}

func TestHandleCommand_methodNotAllowed(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/command", nil)
	w := httptest.NewRecorder()
	s.handleCommand(w, req)
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("want 405, got %d", w.Code)
	}
}

func TestHandleCommand_invalidJSON(t *testing.T) {
	s := newTestServer()
	req := httptest.NewRequest(http.MethodPost, "/command", bytes.NewReader([]byte("bad")))
	w := httptest.NewRecorder()
	s.handleCommand(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestDispatch_allSupportedActions(t *testing.T) {
	noPayload := []ActionType{
		ActionPrevTrack, ActionNextTrack,
		ActionUndo, ActionMuteActive, ActionClearActive, ActionToggleMetronome,
		ActionMergeWithBelow, ActionMergeWithAbove,
		ActionPlayPause, ActionRecord, ActionOverdub, ActionStop,
	}
	s := newTestServer()
	for _, a := range noPayload {
		w := postCommand(t, s, Command{Action: a})
		if w.Code != http.StatusNoContent {
			t.Errorf("action %s: want 204, got %d", a, w.Code)
		}
	}
}

func TestDispatch_selectTrackWithPayload(t *testing.T) {
	s := newTestServer()
	for _, n := range []int{1, 2, 3, 4} {
		w := postCommand(t, s, Command{Action: ActionSelectTrack, Payload: float64(n)})
		if w.Code != http.StatusNoContent {
			t.Errorf("SELECT_TRACK %d: want 204, got %d", n, w.Code)
		}
	}
}

func TestDispatch_selectTrackMissingPayload(t *testing.T) {
	s := newTestServer()
	// Missing payload is silently ignored (no crash, still 204).
	w := postCommand(t, s, Command{Action: ActionSelectTrack})
	if w.Code != http.StatusNoContent {
		t.Errorf("want 204, got %d", w.Code)
	}
}
