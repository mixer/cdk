import { Action } from '@ngrx/store';

export const enum LayoutScreen {
  Welcome,
  Editor,
}

export const enum LayoutActionTypes {
  OPEN_SCREEN = '[Bedrock] Open Screen',
}

export class OpenScreen implements Action {
  public readonly type = LayoutActionTypes.OPEN_SCREEN;

  constructor(public readonly screen: LayoutScreen) {}
}

export type LayoutActions = OpenScreen;
