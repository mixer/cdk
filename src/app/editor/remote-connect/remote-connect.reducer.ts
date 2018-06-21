import { IStateDump } from '@mixer/cdk-std/dist/internal';
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
  stateDump?: IStateDump;
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
        stateDump: undefined,
        remoteState: action.state,
      };
    case RemoteConnectActionTypes.SET_REMOTE_CREDENTIALS:
      return {
        ...state,
        join: action.join,
      };
    case RemoteConnectActionTypes.SET_STATE_DUMP:
      return {
        ...state,
        stateDump: action.dump,
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
 * Selector for whether we should be connected to the remote controls.
 */
export const isRemoteConnected = createSelector(
  remoteState,
  s => s.remoteState === RemoteState.Active,
);

/**
 * Selector for any remote connection error that occurred.
 */
export const selectRemoteError = createSelector(remoteState, s => s.connectionError);

/**
 * Selector for the join message the API gave back to us.
 */
export const selectJoin = createSelector(remoteState, s => s.join);

/**
 * Selector for the state dump of the current controls.
 */
export const selectStateDump = createSelector(remoteState, s => s.stateDump);
