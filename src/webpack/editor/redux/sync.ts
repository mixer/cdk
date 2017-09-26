/**
 * ISyncstate is the state describing which Mixer interactive version the
 * controls are linked to.
 */
export interface ISyncState {
  /**
   * Interactive version the controls are linked to.
   */
  interactiveVersionId: null | number;

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
  interactiveVersionId: null,
  confirmSchemaUpload: true,
};

export function reducer(state: ISyncState, action: any): ISyncState {
  switch (action.type) {
    case Action.Link:
      return { ...state, interactiveVersionId: action.id };
    case Action.Unlink:
      return {
        ...state,
        interactiveVersionId: null,
        confirmSchemaUpload: true,
      };
    case Action.DontConfirmSchema:
      return { ...state, confirmSchemaUpload: false };
    default:
      return state;
  }
}
