import { Action } from '@ngrx/store';
import { RpcError } from '../electron.service';
import { IInteractiveVersion } from '../project/project.actions';

/**
 * State for connection against the remote controls.
 */
export enum RemoteState {
  Disconnected,
  AwaitingGameClient,
  HasError,
  VersionConflict,
  Active,
}

export const enum RemoteConnectActionTypes {
  SET_REMOTE_CHANNEL = '[Controls] Set remote channel',
  SET_REMOTE_STATE = '[Controls] Set remote state',
  SET_REMOTE_CREDENTIALS = '[Controls] Set remote credentials',
  SET_REMOTE_ERROR = '[Controls] Set remote connection error',
}

export const enum RemoteConnectMethods {
  ConnectParticipant = '[Controls] Connect participant',
}

/**
 * IInteractiveJoin is returned from Mixer with details for the user to use
 * to connect to Interactive.
 */
export interface IInteractiveJoin {
  /**
   * Primary websocket address for the participant.
   */
  address: string;

  /**
   * Address of static content to serve for this session.
   */
  contentAddress: string;

  /**
   * Address where live-updated resources are stored.
   */
  ugcAddress: string;

  /**
   * Access key for Interactive
   */
  key: string;

  /**
   * Version ID it's connecting to.
   */
  version: IInteractiveVersion;
}

/**
 * Sets the state of the remote connection.
 */
export class SetRemoteState implements Action {
  public readonly type = RemoteConnectActionTypes.SET_REMOTE_STATE;

  constructor(public readonly state: RemoteState) {}
}

/**
 * Sets the remote channel to connect to.
 */
export class SetRemoteChannel implements Action {
  public readonly type = RemoteConnectActionTypes.SET_REMOTE_CHANNEL;

  constructor(public readonly channel: number) {}
}

/**
 * Sets an error that occurred while connecting to the remote server.
 */
export class SetRemoteError implements Action {
  public readonly type = RemoteConnectActionTypes.SET_REMOTE_ERROR;

  constructor(public readonly error: RpcError) {}
}

/**
 * Sets data used to join to Interactive.
 */
export class SetRemoteCredentials implements Action {
  public readonly type = RemoteConnectActionTypes.SET_REMOTE_CREDENTIALS;

  constructor(public readonly join: IInteractiveJoin) {}
}

export type RemoteConnectActions =
  | SetRemoteState
  | SetRemoteChannel
  | SetRemoteError
  | SetRemoteCredentials;
