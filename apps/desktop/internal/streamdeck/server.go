package streamdeck

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"

	"fgdp-looper/desktop/internal/looper"
)

type Server struct {
	mu     sync.Mutex
	engine *looper.Engine
	server *http.Server
}

func NewServer(engine *looper.Engine) *Server {
	return &Server{engine: engine}
}

func (s *Server) Start(addr string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/command", s.handleCommand)

	s.server = &http.Server{Addr: addr, Handler: mux}
	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("streamdeck server error: %v", err)
	}
}

func (s *Server) Stop() {
	if s.server != nil {
		s.server.Shutdown(context.Background()) //nolint:errcheck
	}
}

func (s *Server) handleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 4096))
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var cmd Command
	if err := json.Unmarshal(body, &cmd); err != nil {
		log.Printf("invalid command: %v", err)
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	s.dispatch(cmd)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) dispatch(cmd Command) {
	switch cmd.Action {
	case ActionSelectTrack:
		if n, ok := payloadInt(cmd.Payload); ok {
			s.engine.SelectTrack(n)
		}
	case ActionPrevTrack:
		s.engine.PrevTrack()
	case ActionNextTrack:
		s.engine.NextTrack()
	case ActionUndo:
		s.engine.Undo()
	case ActionMuteActive:
		s.engine.MuteActive()
	case ActionClearActive:
		s.engine.ClearActive()
	case ActionToggleMetronome:
		s.engine.ToggleMetronome()
	case ActionMergeWithBelow:
		s.engine.MergeWithBelow()
	case ActionPlayPause:
		s.engine.Play()
	case ActionRecord:
		s.engine.Record()
	case ActionOverdub:
		s.engine.Overdub()
	case ActionStop:
		s.engine.Stop()
	}
}

// payloadInt extracts an integer from a JSON-decoded payload (float64 from JSON, or int).
func payloadInt(p any) (int, bool) {
	switch v := p.(type) {
	case float64:
		return int(v), true
	case int:
		return v, true
	}
	return 0, false
}
