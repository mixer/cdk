import { Action } from '@ngrx/store';
import { IUser } from '../../../server/profile';

export const enum AccountActionTypes {
  START_LOGOUT = '[Account] Start Logout',
  FINISH_LOGOUT = '[Account] Finish Logout',
  OPEN_LOGIN_FLOW = '[Account] Open Login Flow',
  SET_LOGGED_IN_ACCOUNT = '[Account] Set logged in account',
  LINK_REFRESH_CODE = '[Account] Refresh linking code',
  LINK_SET_CODE = '[Account] Set linking code',
  LINK_CANCEL = '[Account] Cancel account linking',
}

export const enum AccountMethods {
  LinkAccount = '[Account] Start Linking',
  GetLinkedAccount = '[Account] Get Linked',
  Logout = '[Account] Log Out'
}

export class StartLogout implements Action {
  public readonly type = AccountActionTypes.START_LOGOUT;
}

export class FinishLogout implements Action {
  public readonly type = AccountActionTypes.FINISH_LOGOUT;
}

export class SetLoggedInAccount implements Action {
  public readonly type = AccountActionTypes.SET_LOGGED_IN_ACCOUNT;

  constructor(public readonly account: IUser) {}
}

export class RefreshLinkCode implements Action {
  public readonly type = AccountActionTypes.LINK_REFRESH_CODE;
}

export class SetLinkCode implements Action {
  public readonly type = AccountActionTypes.LINK_SET_CODE;

  constructor(public readonly code: string, public readonly expiresAt: Date) {}
}

export class CancelLinking implements Action {
  public readonly type = AccountActionTypes.LINK_CANCEL;
}

export type AccountActions = StartLogout | FinishLogout | SetLoggedInAccount | RefreshLinkCode | SetLinkCode | CancelLinking;
