import { IStateDump } from '@mcph/miix-std/dist/internal';

/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export enum CodeState {
  Scenes,
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
   * given in pixels, 0 to 100
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
  scenes: string[];
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
  SetScenes = 'CODE_SET_SCENES',
  SetGroups = 'CODE_SET_GROUPS',
}

export const stateToProp: { [key: number]: keyof IStateDump } = {
  [CodeState.Scenes]: 'scenes',
  [CodeState.Participant]: 'participant',
  [CodeState.Groups]: 'groups',
};

export const stateToUpdateAction: { [key: number]: Action } = {
  [CodeState.Scenes]: Action.SetScenes,
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
  sparks: 500,
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
        cost: 100,
        progress: 0.5,
        disabled: true,
        position: [
          {
            width: 10,
            height: 8,
            size: 'large',
            x: 0,
            y: 0,
          }
        ]
      },
      {
        controlID: 'my_awesome_joystick',
        kind: 'joystick',
        disabled: true,
        angle: 0.7,
        intensity: 0.5,
        position: [
          {
            width: 7,
            height: 7,
            size: 'large',
            x: 11,
            y: 0,
          }
        ]
      }
    ]
  }
]`;

export const initialState = {
  state: CodeState.Scenes,
  width: 500,
  participant: initialParticipant.split('\n'),
  scenes: initialControls.split('\n'),
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
    case Action.SetScenes:
      return { ...state, scenes: action.data };
    case Action.SetGroups:
      return { ...state, groups: action.data };
    default:
      return state;
  }
}
