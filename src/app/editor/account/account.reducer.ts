import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { IUser } from '../../../server/profile';
import * as fromRoot from '../bedrock.reducers';
import { AccountActions, AccountActionTypes } from './account.actions';

export interface IAccountState {
  user?: IUser;
  linkCode?: {
    code: string;
    expiresAt: Date;
  };
}

export interface IState extends fromRoot.IState {
  layout: IAccountState;
}

const initialState: IAccountState = {};

export function accountReducer(
  state: IAccountState = initialState,
  action: AccountActions,
): IAccountState {
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
export const accountState: MemoizedSelector<IState, IAccountState> = createFeatureSelector<
  IAccountState
>('account');

/**
 * Selects the currently logged in user.
 */
export const currentUser = createSelector(accountState, s => s.user);

/**
 * Selects the current link code.
 */
export const linkCode = createSelector(accountState, s => s.linkCode);
