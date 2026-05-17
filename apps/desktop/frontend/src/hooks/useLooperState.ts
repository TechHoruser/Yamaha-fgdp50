import { useState, useEffect, useCallback } from 'react'
import * as WailsApp from '../wailsjs/go/main/App'
import type { LooperState, Track } from '../types'

const INITIAL_STATE: LooperState = {
  tracks: [1, 2, 3, 4].map((id): Track => ({
    id,
    state: 'idle',
    muted: false,
    hasLoop: false,
  })),
  activeTrack: 1,
  globalState: 'idle',
  metronomeActive: false,
  bpm: 120,
}

export function useLooperState() {
  const [state, setState] = useState<LooperState>(INITIAL_STATE)

  const refresh = useCallback(async () => {
    try {
      const [rawTracks, metronomeActive, activeTrack, bpm] = await Promise.all([
        WailsApp.GetTracks(),
        WailsApp.IsMetronomeActive(),
        WailsApp.GetActiveTrack(),
        WailsApp.GetBpm(),
      ])
      if (rawTracks?.length) {
        setState(prev => ({
          ...prev,
          tracks: rawTracks as Track[],
          metronomeActive: metronomeActive ?? prev.metronomeActive,
          activeTrack: activeTrack ?? prev.activeTrack,
          bpm: bpm ?? prev.bpm,
        }))
      }
    } catch {
      // Wails runtime unavailable in browser-only dev mode
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 300)
    return () => clearInterval(id)
  }, [refresh])

  // Returns the Wails return value so callers (e.g. AddTrack) can use it.
  const dispatch = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (action: keyof typeof WailsApp, ...args: unknown[]): Promise<any> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (WailsApp[action] as any)?.(...args)
        await refresh()
        return result
      } catch {
        // Wails runtime unavailable
      }
    },
    [refresh],
  )

  // Optimistic update: update local state immediately and confirm via Wails.
  // If the backend rejects, the next poll will correct the state.
  const selectTrack = useCallback(
    (id: number) => {
      setState((prev) => {
        // Guard: only update if the track actually exists in the current state.
        if (!prev.tracks.some(t => t.id === id)) return prev
        return { ...prev, activeTrack: id }
      })
      WailsApp.SelectTrack(id).catch(() => {})
    },
    [],
  )

  const removeTrackOptimistic = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== id),
      // Clamp activeTrack if we just removed the active track
      activeTrack: prev.activeTrack === id
        ? (prev.tracks.find(t => t.id !== id)?.id ?? prev.activeTrack)
        : prev.activeTrack,
    }))
  }, [])

  return { state, setState, dispatch, refresh, selectTrack, removeTrackOptimistic }
}
