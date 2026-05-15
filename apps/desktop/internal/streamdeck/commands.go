package streamdeck

type ActionType string

const (
	// Row 1 — Direct track selection (payload: track number as integer)
	ActionSelectTrack ActionType = "SELECT_TRACK"
	ActionUndo        ActionType = "UNDO"

	// Row 2 — Active track actions
	ActionPrevTrack       ActionType = "PREV_TRACK"
	ActionNextTrack       ActionType = "NEXT_TRACK"
	ActionMuteActive      ActionType = "MUTE_ACTIVE"
	ActionClearActive     ActionType = "CLEAR_ACTIVE"
	ActionToggleMetronome ActionType = "TOGGLE_METRONOME"
	ActionMergeWithBelow  ActionType = "MERGE_WITH_BELOW"

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
