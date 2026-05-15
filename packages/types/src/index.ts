export interface Track {
  id: number
  state: 'idle' | 'recording' | 'playing' | 'overdubbing' | 'muted'
  muted: boolean
  hasLoop: boolean
}

export interface LooperState {
  tracks: Track[]
  activeTrack: number
  globalState: 'idle' | 'playing' | 'recording' | 'overdubbing'
  metronomeActive: boolean
  bpm: number
}
