import { createFeatureSelector, MemoizedSelector, createSelector } from '@ngrx/store';

import { MenuBarActions, MenuBarActionTypes, OpenDirection } from './menu-bar.actions';
import * as fromRoot from '../../bedrock.reducers';

export interface MenuBarState {
  openMenu: string | null;
  direction: OpenDirection;
}

export interface State extends fromRoot.State {
  menuBar: MenuBarState;
}

const initialState: MenuBarState = {
  openMenu: null,
  direction: OpenDirection.Right,
};

export function menuBarReducer(
  state: MenuBarState = initialState,
  action: MenuBarActions,
): MenuBarState {
  switch (action.type) {
    case MenuBarActionTypes.OPEN_MENU:
      return { ...state, openMenu: action.menuId, direction: action.direction };
    case MenuBarActionTypes.CLOSE_MENU:
      if (!action.menuId || state.openMenu === action.menuId) {
        return { ...state, openMenu: null };
      }

      return state;
    default:
      return state;
  }
}

/**
 * Selector for the menuBar feature.
 */
export const menuBarState: MemoizedSelector<State, MenuBarState> = createFeatureSelector<
  MenuBarState
>('menuBar');

/**
 * Selects the open menu.
 */
export const selectOpenMenu = createSelector(menuBarState, s => s.openMenu);

/**
 * Selects the open menu's direction.
 */
export const selectDirection = createSelector(menuBarState, s => s.direction);
