import { Action } from '@ngrx/store';

export const enum OpenDirection {
  Right,
  Left,
}

export const enum MenuBarActionTypes {
  OPEN_MENU = '[MenuBar] Open Menu',
  CLOSE_MENU = '[MenuBar] Close Menu',
}

/**
 * Closes any currently open menu, or the specific one, if provided.
 */
export class CloseMenu implements Action {
  public readonly type = MenuBarActionTypes.CLOSE_MENU;

  constructor(public readonly menuId?: string) {}
}

/**
 * Opens the provided menu, by ID.
 */
export class OpenMenu implements Action {
  public readonly type = MenuBarActionTypes.OPEN_MENU;

  constructor(public readonly menuId: string, public readonly direction: OpenDirection) {}
}

export type MenuBarActions = OpenMenu | CloseMenu;
