import { createFeatureSelector, MemoizedSelector, createSelector } from '@ngrx/store';

import { MenuBarActions, MenuBarActionTypes } from './menu-bar.actions';
import * as fromRoot from '../../bedrock.reducers';


export interface MenuBarState {
  openMenu: string | null;
}

export interface State extends fromRoot.State {
  menuBar: MenuBarState;
}

const initialState: MenuBarState = {
  openMenu: null,
};

export function menuBarReducer(
  state: MenuBarState = initialState,
  action: MenuBarActions,
): MenuBarState {
  switch (action.type) {
    case MenuBarActionTypes.OPEN_MENU:
      return { ...state, openMenu: action.menuId };
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
export const MenuBarState: MemoizedSelector<State, MenuBarState> = createFeatureSelector<MenuBarState>('menuBar');

/**
 * Selects the open menu.
 */
export const selectOpenMenu = createSelector(MenuBarState, s => s.openMenu);
