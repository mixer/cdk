import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { MenuBarActions, MenuBarActionTypes, OpenDirection } from './menu-bar.actions';

export interface IMenuBarState {
  openMenu: string | null;
  direction: OpenDirection;
}

export interface IState extends fromRoot.IState {
  menuBar: IMenuBarState;
}

const initialState: IMenuBarState = {
  openMenu: null,
  direction: OpenDirection.Right,
};

export function menuBarReducer(
  state: IMenuBarState = initialState,
  action: MenuBarActions,
): IMenuBarState {
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
export const menuBarState: MemoizedSelector<IState, IMenuBarState> = createFeatureSelector<
  IMenuBarState
>('menuBar');

/**
 * Selects the open menu.
 */
export const selectOpenMenu = createSelector(menuBarState, s => s.openMenu);

/**
 * Selects the open menu's direction.
 */
export const selectDirection = createSelector(menuBarState, s => s.direction);
