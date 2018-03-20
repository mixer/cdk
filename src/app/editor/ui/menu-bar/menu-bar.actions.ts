import { Action } from '@ngrx/store';

export const enum OpenDirection {
  Right,
  Left,
}

export const enum MenuBarActionTypes {
  OPEN_MENU = '[MenuBar] Open Menu',
  CLOSE_MENU = '[MenuBar] Close Menu',
}

export class CloseMenu implements Action {
  public readonly type = MenuBarActionTypes.CLOSE_MENU;

  constructor(public readonly menuId?: string) {}
}

export class OpenMenu implements Action {
  public readonly type = MenuBarActionTypes.OPEN_MENU;

  constructor(public readonly menuId: string, public readonly direction: OpenDirection) {}
}

export type MenuBarActions = OpenMenu | CloseMenu;
