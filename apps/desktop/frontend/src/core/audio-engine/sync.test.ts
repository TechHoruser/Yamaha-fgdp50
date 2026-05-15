import { describe, it, expect } from 'vitest'
import { beatsToSeconds, secondsToBeats, quantizeToGrid } from './sync'

describe('beatsToSeconds', () => {
  it('converts 1 beat at 60 BPM to 1 second', () => {
    expect(beatsToSeconds(1, 60)).toBe(1)
  })
  it('converts 1 beat at 120 BPM to 0.5 s', () => {
    expect(beatsToSeconds(1, 120)).toBe(0.5)
  })
  it('converts 4 beats at 120 BPM to 2 s', () => {
    expect(beatsToSeconds(4, 120)).toBe(2)
  })
})

describe('secondsToBeats', () => {
  it('converts 1 s at 60 BPM to 1 beat', () => {
    expect(secondsToBeats(1, 60)).toBe(1)
  })
  it('is the inverse of beatsToSeconds', () => {
    expect(secondsToBeats(beatsToSeconds(3, 120), 120)).toBeCloseTo(3)
  })
})

describe('quantizeToGrid', () => {
  it('snaps to nearest 16th note at 120 BPM', () => {
    const tick = beatsToSeconds(1 / 4, 120) // 0.125 s
    expect(quantizeToGrid(0.06, 120)).toBeCloseTo(0)
    expect(quantizeToGrid(0.07, 120)).toBeCloseTo(tick)
  })
  it('leaves an on-grid value unchanged', () => {
    const onBeat = beatsToSeconds(1, 120)
    expect(quantizeToGrid(onBeat, 120)).toBeCloseTo(onBeat)
  })
  it('accepts custom subdivision', () => {
    const halfBeat = beatsToSeconds(0.5, 60)
    expect(quantizeToGrid(halfBeat + 0.01, 60, 2)).toBeCloseTo(halfBeat)
  })
})
