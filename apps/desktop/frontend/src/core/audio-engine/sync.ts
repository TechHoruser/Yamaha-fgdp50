export interface ClockSync {
  bpm: number
  ticksPerBeat: number
  currentTick: number
}

export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats / bpm) * 60
}

export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60
}

export function quantizeToGrid(time: number, bpm: number, subdivision: number = 4): number {
  const tickDuration = beatsToSeconds(1 / subdivision, bpm)
  return Math.round(time / tickDuration) * tickDuration
}
