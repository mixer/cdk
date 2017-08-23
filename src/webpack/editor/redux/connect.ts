import { IStateDump } from '../../../stdlib/mixer';

/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export const enum ConnectState {
  Idle,
  Active,
}

/**
 * IInteractiveJoin is returned from Mixer with details for the user to use
 * to connect to Interactive.
 */
export interface IInteractiveJoin {
  address: string;
  contentAddress: string;
}

/**
 * IConnectState is the state describing whether the controls are connected
 * to Mixer interactive.
 */
export interface IConnectState {
  state: ConnectState;
  /**
   * Nested controls state.
   */
  controlsState?: IStateDump;
  /**
   * Address where Interactive lives. A subset of the response given by
   * the Mixer backend on /api/v1/interactive/{channel}
   */
  join?: IInteractiveJoin;
}

export const enum Action {
  Connect = 'CONNECT_CONNECT',
  Disconnect = 'CONNECT_DISCONNECT',
  UpdateState = 'CONNECT_UPDATE_STATE',
}

export const initialState = {
  state: ConnectState.Idle,
};

export function reducer(state: IConnectState, action: any): IConnectState {
  switch (action.type) {
    case Action.Connect:
      return { ...state, state: ConnectState.Active, join: action.data };
    case Action.Disconnect:
      return { ...state, state: ConnectState.Idle, join: undefined };
    case Action.UpdateState:
      return { ...state, controlsState: action.controlsState };
    default:
      return state;
  }
}
