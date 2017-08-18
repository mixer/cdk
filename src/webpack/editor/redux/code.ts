/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export enum CodeState {
  Controls,
  Participant,
  Groups,
  Closed,
  Console,
}

/**
 * Max enum value when the code editor should still be shown.
 */
export const MaxEditableState = CodeState.Groups; // tslint:disable-line

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
  /**
   * Raw json5 data for the groups. Split by lines of code
   * (primarily to make diffing faster).
   */
  groups: string[];
}

export const enum Action {
  SetState = 'CODE_SET_STATE',
  Resize = 'CODE_RESIZE',
  SetParticipant = 'CODE_SET_PARTICIPANT',
  SetControls = 'CODE_SET_CONTROLS',
  SetGroups = 'CODE_SET_GROUPS',
}

export const stateToProp = {
  [CodeState.Controls]: 'controls',
  [CodeState.Participant]: 'participant',
  [CodeState.Groups]: 'groups',
};

export const stateToUpdateAction = {
  [CodeState.Controls]: Action.SetControls,
  [CodeState.Participant]: Action.SetParticipant,
  [CodeState.Groups]: Action.SetGroups,
};

const initialParticipant = `{
  sessionID: 'e1fefc78-d4cc-4c69-b2d9-b36ed5c52893',
  userID: 1,
  username: 'Mr_Tester',
  level: 42,
  lastInputAt: ${Date.now()},
  connectedAt: ${Date.now()},
  disabled: false,
  groupID: 'default',
}`;

const initialGroups = `[
  {
    groupID: 'default',
    sceneID: 'default',
  },
]`;

const initialControls = `[
  {
    sceneID: 'default',
    controls: [
      {
        controlID: 'my_first_button',
        kind: 'button',
        text: 'My First Button',
        grids: [
          {
            width: 10,
            height: 8,
            size: 'large',
            x: 0,
            y: 0
          }
        ]
      }
    ]
  }
]`;

export const initialState = {
  state: CodeState.Controls,
  width: 50,
  participant: initialParticipant.split('\n'),
  controls: initialControls.split('\n'),
  groups: initialGroups.split('\n'),
};

export function reducer(state: ICodeState, action: any): ICodeState {
  switch (action.type) {
    case Action.SetState:
      return { ...state, state: action.state };
    case Action.Resize:
      return { ...state, width: action.width };
    case Action.SetParticipant:
      return { ...state, participant: action.data };
    case Action.SetControls:
      return { ...state, controls: action.data };
    case Action.SetGroups:
      return { ...state, groups: action.data };
    default:
      return state;
  }
}
