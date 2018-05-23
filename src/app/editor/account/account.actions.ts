import { Action } from '@ngrx/store';
import { IUser } from '../../../server/profile';

export const enum AccountActionTypes {
  START_LOGOUT = '[Account] Start Logout',
  FINISH_LOGOUT = '[Account] Finish Logout',
  SWITCH_ACCOUNTS = '[Account] Log out and in again',
  OPEN_LOGIN_FLOW = '[Account] Open Login Flow',
  SET_LOGGED_IN_ACCOUNT = '[Account] Set logged in account',
  LINK_SET_CODE = '[Account] Set linking code',
  LINK_CANCEL = '[Account] Cancel account linking',
  REQUIRE_AUTH = '[Account] Require Authentication',
}

export const enum AccountMethods {
  LinkAccount = '[Account] Start Linking',
  GetLinkedAccount = '[Account] Get Linked',
  Logout = '[Account] Log Out',
}

/**
 * Starts the user logging out.
 */
export class StartLogout implements Action {
  public readonly type = AccountActionTypes.START_LOGOUT;
}

/**
 * Fired by the account effects when a logout has been complete.
 */
export class FinishLogout implements Action {
  public readonly type = AccountActionTypes.FINISH_LOGOUT;
}

/**
 * Updates the logged in account.
 */
export class SetLoggedInAccount implements Action {
  public readonly type = AccountActionTypes.SET_LOGGED_IN_ACCOUNT;

  constructor(public readonly account: IUser) {}
}

/**
 * Updates the current code for the user to link their account.
 */
export class SetLinkCode implements Action {
  public readonly type = AccountActionTypes.LINK_SET_CODE;

  constructor(public readonly code: string, public readonly expiresAt: Date) {}
}

/**
 * Fired to stop the account linking process.
 */
export class CancelLinking implements Action {
  public readonly type = AccountActionTypes.LINK_CANCEL;
}

/**
 * Requires authentication before dispatching the given action. Dispatches
 * the failedAction, if provided, if authentication is cancelled.
 */
export class RequireAuth implements Action {
  public readonly type = AccountActionTypes.REQUIRE_AUTH;

  constructor(public readonly successAction: Action, public readonly failedAction?: Action) {}
}

/**
 * Changes the account the user is logged into.
 */
export class SwitchAccounts implements Action {
  public readonly type = AccountActionTypes.SWITCH_ACCOUNTS;

  constructor(public readonly successAction?: Action, public readonly failedAction?: Action) {}
}

export type AccountActions =
  | StartLogout
  | FinishLogout
  | SetLoggedInAccount
  | SetLinkCode
  | CancelLinking
  | SwitchAccounts;
