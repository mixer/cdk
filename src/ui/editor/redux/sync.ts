/**
 * Partial typings for an InteractiveVersion resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveVersion}
 */
export interface IInteractiveVersion {
  id: number;
  version: string;
  state: string;
  changelog: string;
  versionOrder: number;
  installation: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Partial typings for an InteractiveGame resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveGame}
 */
export interface IInteractiveGame {
  id: number;
  name: string;
}

/**
 * Describes an InteractiveVersion with a nested parent game.
 */
export interface IInteractiveVersionWithGame extends IInteractiveVersion {
  game: IInteractiveGame;
}

/**
 * ISyncstate is the state describing which Mixer interactive version the
 * controls are linked to.
 */
export interface ISyncState {
  /**
   * Interactive version the controls are linked to.
   */
  interactiveVersion: null | IInteractiveVersionWithGame;

  /**
   * Whether to prompt each time the user wants to upload a control schema.
   */
  confirmSchemaUpload: boolean;
}

export const enum Action {
  Link = 'SYNC_LINK',
  Unlink = 'SYNC_UNLINK',
  DontConfirmSchema = 'SYNC_DONT_CONFIRM_SCHEMA',
}

export const initialState = {
  interactiveVersion: null,
  confirmSchemaUpload: true,
};

export function reducer(state: ISyncState, action: any): ISyncState {
  switch (action.type) {
    case Action.Link:
      return { ...state, interactiveVersion: action.version };
    case Action.Unlink:
      return {
        ...state,
        interactiveVersion: null,
        confirmSchemaUpload: true,
      };
    case Action.DontConfirmSchema:
      return { ...state, confirmSchemaUpload: false };
    default:
      return state;
  }
}
