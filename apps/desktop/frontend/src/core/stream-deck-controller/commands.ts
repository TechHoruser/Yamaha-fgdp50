export enum StreamDeckAction {
  // Row 1 — Direct track selection
  SelectTrack1 = 'SELECT_TRACK_1',
  SelectTrack2 = 'SELECT_TRACK_2',
  SelectTrack3 = 'SELECT_TRACK_3',
  SelectTrack4 = 'SELECT_TRACK_4',
  Undo = 'UNDO',

  // Row 2 — Active track actions
  PrevTrack = 'PREV_TRACK',
  NextTrack = 'NEXT_TRACK',
  MuteActive = 'MUTE_ACTIVE',
  ClearActive = 'CLEAR_ACTIVE',
  ToggleMetronome = 'TOGGLE_METRONOME',

  // Row 3 — Transport
  PlayPause = 'PLAY_PAUSE',
  Record = 'RECORD',
  Overdub = 'OVERDUB',
  Stop = 'STOP',
  Shift = 'SHIFT',
}

export interface StreamDeckCommand {
  action: StreamDeckAction
  payload?: unknown
}

export const STREAM_DECK_LAYOUT: StreamDeckAction[][] = [
  [StreamDeckAction.SelectTrack1, StreamDeckAction.SelectTrack2, StreamDeckAction.SelectTrack3, StreamDeckAction.SelectTrack4, StreamDeckAction.Undo],
  [StreamDeckAction.PrevTrack, StreamDeckAction.NextTrack, StreamDeckAction.MuteActive, StreamDeckAction.ClearActive, StreamDeckAction.ToggleMetronome],
  [StreamDeckAction.PlayPause, StreamDeckAction.Record, StreamDeckAction.Overdub, StreamDeckAction.Stop, StreamDeckAction.Shift],
]
