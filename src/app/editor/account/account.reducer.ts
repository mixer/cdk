import { createFeatureSelector, MemoizedSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { IUser } from '../../../server/profile';
import { AccountActions, AccountActionTypes } from './account.actions';

export interface AccountState {
  user?: IUser;
  linkCode?: {
    code: string;
    expiresAt: Date;
  };
}

export interface State extends fromRoot.State {
  layout: AccountState;
}

const initialState: AccountState = {};

export function accountReducer(
  state: AccountState = initialState,
  action: AccountActions,
): AccountState {
  switch (action.type) {
    case AccountActionTypes.LINK_SET_CODE:
      return { ...state, linkCode: { code: action.code, expiresAt: new Date(action.expiresAt) } };
    case AccountActionTypes.LINK_CANCEL:
      return { ...state, linkCode: undefined };
    case AccountActionTypes.FINISH_LOGOUT:
      return { ...state, user: undefined };
    case AccountActionTypes.SET_LOGGED_IN_ACCOUNT:
      return { ...state, user: action.account };
    default:
      return state;
  }
}

/**
 * Selector for the account feature.
 */
export const accountState: MemoizedSelector<State, AccountState> = createFeatureSelector<
  AccountState
>('account');

/**
 * Selects the currently logged in user.
 */
export const currentUser = createSelector(accountState, s => s.user);

/**
 * Selects the current link code.
 */
export const linkCode = createSelector(accountState, s => s.linkCode);
