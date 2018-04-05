import { createFeatureSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { RpcError } from '../electron.service';
import {
  IInteractiveJoin,
  RemoteConnectActions,
  RemoteConnectActionTypes,
  RemoteState,
} from './remote-connect.actions';

export interface IRemoteConnectState {
  channelId?: number;
  connectionError?: RpcError;
  join?: IInteractiveJoin;
  remoteState: RemoteState;
}

export interface IState extends fromRoot.IState {
  layout: IRemoteConnectState;
}

const initialState: IRemoteConnectState = {
  remoteState: RemoteState.Disconnected,
};

export function remoteConnectReducer(
  state: IRemoteConnectState = initialState,
  action: RemoteConnectActions,
): IRemoteConnectState {
  switch (action.type) {
    case RemoteConnectActionTypes.SET_REMOTE_CHANNEL:
      return {
        ...state,
        channelId: action.channel,
        remoteState: RemoteState.Disconnected,
      };
    case RemoteConnectActionTypes.SET_REMOTE_ERROR:
      return {
        ...state,
        connectionError: action.error,
        remoteState: RemoteState.HasError,
      };
    case RemoteConnectActionTypes.SET_REMOTE_STATE:
      return {
        ...state,
        connectionError: undefined,
        remoteState: action.state,
      };
    case RemoteConnectActionTypes.SET_REMOTE_CREDENTIALS:
      return {
        ...state,
        join: action.join,
      };
    default:
      return state;
  }
}

/**
 * Selector for the remote connect feature.
 */
export const remoteState = createFeatureSelector<IRemoteConnectState>('remoteConnect');

/**
 * Selector for the remote channel state.
 */
export const selectRemoteState = createSelector(remoteState, s => s.remoteState);

/**
 * Selector for the current remote channel.
 */
export const selectRemoteChannel = createSelector(remoteState, s => s.channelId);

/**
 * Selector for any remote connection error that occurred.
 */
export const selectRemoteError = createSelector(remoteState, s => s.connectionError);

/**
 * Selector for the join message the API gave back to us.
 */
export const selectJoin = createSelector(remoteState, s => s.join);
