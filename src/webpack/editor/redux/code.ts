/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export const enum CodeState {
  Closed,
  Controls,
  Participant,
}

/**
 * ICodeState is the state is the editor's code editor.
 */
export interface ICodeState {
  state: CodeState;
  /**
   * given in a percent of screen width, 0 to 100
   */
  width: number;
  /**
   * Raw json5 data for the participant model. Split by lines of code
   * (primarily to make diffing faster).
   */
  participant: string[];
  /**
   * Raw json5 data for the controls model. Split by lines of code
   * (primarily to make diffing faster).
   */
  controls: string[];
}

export const enum Action {
  SetState = 'CODE_SET_STATE',
  Resize = 'CODE_RESIZE',
  SetParticipant = 'CODE_SET_PARTICIPANT',
  SetControls = 'CODE_SET_CONTROLS',
}

export function reducer(state: ICodeState, action: any): ICodeState {
  switch (action.type) {
    case Action.SetState:
      return { ...state, state: action.state };
    case Action.Resize:
      return { ...state, width: action.width };
    case Action.SetParticipant:
      return { ...state, width: action.data };
    case Action.SetControls:
      return { ...state, width: action.controls };
    default:
      return state;
  }
}
