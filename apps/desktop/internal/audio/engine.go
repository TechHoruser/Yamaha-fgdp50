package audio

import "sync"

type Engine struct {
	mu         sync.RWMutex
	sampleRate int
	bufferSize int
	running    bool
}

func NewEngine(sampleRate, bufferSize int) *Engine {
	return &Engine{
		sampleRate: sampleRate,
		bufferSize: bufferSize,
	}
}

func (e *Engine) Start() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.running = true
	return nil
}

func (e *Engine) Stop() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.running = false
}

func (e *Engine) IsRunning() bool {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.running
}
