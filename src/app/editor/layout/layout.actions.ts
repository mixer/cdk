import { Action } from '@ngrx/store';

export const enum LayoutScreen {
  Welcome,
  Editor,
}

export const enum LayoutActionTypes {
  OPEN_SCREEN = '[Bedrock] Open Screen',
}

/**
 * Triggers a different primary layout screen to be shown.
 */
export class OpenScreen implements Action {
  public readonly type = LayoutActionTypes.OPEN_SCREEN;

  constructor(public readonly screen: LayoutScreen) {}
}

export type LayoutActions = OpenScreen;
