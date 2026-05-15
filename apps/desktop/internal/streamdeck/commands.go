package streamdeck

type ActionType string

const (
	// Row 1 — Direct track selection
	ActionSelectTrack1 ActionType = "SELECT_TRACK_1"
	ActionSelectTrack2 ActionType = "SELECT_TRACK_2"
	ActionSelectTrack3 ActionType = "SELECT_TRACK_3"
	ActionSelectTrack4 ActionType = "SELECT_TRACK_4"
	ActionUndo         ActionType = "UNDO"

	// Row 2 — Active track actions
	ActionPrevTrack       ActionType = "PREV_TRACK"
	ActionNextTrack       ActionType = "NEXT_TRACK"
	ActionMuteActive      ActionType = "MUTE_ACTIVE"
	ActionClearActive     ActionType = "CLEAR_ACTIVE"
	ActionToggleMetronome ActionType = "TOGGLE_METRONOME"

	// Row 3 — Transport
	ActionPlayPause ActionType = "PLAY_PAUSE"
	ActionRecord    ActionType = "RECORD"
	ActionOverdub   ActionType = "OVERDUB"
	ActionStop      ActionType = "STOP"
	ActionShift     ActionType = "SHIFT"
)

type Command struct {
	Action  ActionType `json:"action"`
	Payload any        `json:"payload,omitempty"`
}
