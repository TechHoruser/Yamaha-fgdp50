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
      const [rawTracks, metronomeActive, activeTrack] = await Promise.all([
        WailsApp.GetTracks(),
        WailsApp.IsMetronomeActive(),
        WailsApp.GetActiveTrack(),
      ])
      if (rawTracks?.length) {
        setState(prev => ({
          ...prev,
          tracks: rawTracks as Track[],
          metronomeActive: metronomeActive ?? prev.metronomeActive,
          activeTrack: activeTrack ?? prev.activeTrack,
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

  const dispatch = useCallback(
    async (action: keyof typeof WailsApp, ...args: unknown[]) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (WailsApp[action] as any)?.(...args)
        await refresh()
      } catch {
        // Wails runtime unavailable
      }
    },
    [refresh],
  )

  return { state, dispatch, refresh }
}
