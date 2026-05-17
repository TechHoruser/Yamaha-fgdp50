export enum StreamDeckAction {
  // Track selection (send track number as payload)
  SelectTrack = 'SELECT_TRACK',
  Undo = 'UNDO',

  // Active track actions
  PrevTrack = 'PREV_TRACK',
  NextTrack = 'NEXT_TRACK',
  MuteActive = 'MUTE_ACTIVE',
  ClearActive = 'CLEAR_ACTIVE',
  ToggleMetronome = 'TOGGLE_METRONOME',
  MergeWithBelow = 'MERGE_WITH_BELOW',
  MergeWithAbove = 'MERGE_WITH_ABOVE',

  // Transport
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

export const STREAM_DECK_LAYOUT: StreamDeckCommand[][] = [
  [
    { action: StreamDeckAction.SelectTrack, payload: 1 },
    { action: StreamDeckAction.SelectTrack, payload: 2 },
    { action: StreamDeckAction.SelectTrack, payload: 3 },
    { action: StreamDeckAction.SelectTrack, payload: 4 },
    { action: StreamDeckAction.Undo },
  ],
  [
    { action: StreamDeckAction.PrevTrack },
    { action: StreamDeckAction.NextTrack },
    { action: StreamDeckAction.MuteActive },
    { action: StreamDeckAction.ClearActive },
    { action: StreamDeckAction.ToggleMetronome },
  ],
  [
    { action: StreamDeckAction.PlayPause },
    { action: StreamDeckAction.Record },
    { action: StreamDeckAction.Overdub },
    { action: StreamDeckAction.Stop },
    { action: StreamDeckAction.Shift },
  ],
]
