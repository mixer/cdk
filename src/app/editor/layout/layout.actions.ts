import { Action } from '@ngrx/store';
import * as GoldenLayout from 'golden-layout';

export const enum LayoutScreen {
  Welcome,
  Editor,
}

export enum GoldenPanel {
  ControlSchema = 'ControlSchema',
  Controls = 'Controls',
}

export const panelTitles: { [k in GoldenPanel]: string } = {
  [GoldenPanel.ControlSchema]: 'Control Schema',
  [GoldenPanel.Controls]: 'Controls',
};

export const enum LayoutActionTypes {
  OPEN_SCREEN = '[Layout] Open Screen',
  PANELS_SAVE = '[Layout] Save Panel Positions',
  OPEN_PANEL = '[Layout] Open a Panel',
  CLOSE_PANEL = '[Layout] Close a Panel',
  SET_GOLDEN_LAYOUT = '[Layout] Set the golden layout instance',
  CLEAR_GOLDEN_LAYOUT = '[Layout] Unsets the golden layout component',
}

export const enum LayoutMethod {
  SavePanels = '[Layout] Save panels',
  LoadPanels = '[Layout] Load panels',
}

/**
 * Triggers a different primary layout screen to be shown.
 */
export class OpenScreen implements Action {
  public readonly type = LayoutActionTypes.OPEN_SCREEN;

  constructor(public readonly screen: LayoutScreen) {}
}

/**
 * Saves panel positions which the user has manually adjusted.
 */
export class SavePanels implements Action {
  public readonly type = LayoutActionTypes.PANELS_SAVE;

  constructor(
    public readonly panels: GoldenLayout.ItemConfigType[],
    public readonly propogateToServer: boolean = true,
  ) {}
}

/**
 * Triggers a panel to be opened in the layout..
 */
export class OpenPanel implements Action {
  public readonly type = LayoutActionTypes.OPEN_PANEL;

  constructor(public readonly panel: GoldenPanel) {}
}

/**
 * Closes a previously open panel in the layout.
 */
export class ClosePanel implements Action {
  public readonly type = LayoutActionTypes.CLOSE_PANEL;

  constructor(public readonly panel: GoldenPanel) {}
}

/**
 * Sets the current GoldenLayout instance.
 */
export class SetGoldenLayout implements Action {
  public readonly type = LayoutActionTypes.SET_GOLDEN_LAYOUT;

  constructor(public readonly layout: GoldenLayout) {}
}

/**
 * Clears any currently opened golden layout.
 */
export class ClearGoldenLayout implements Action {
  public readonly type = LayoutActionTypes.CLEAR_GOLDEN_LAYOUT;
}

export type LayoutActions =
  | OpenScreen
  | SavePanels
  | OpenPanel
  | ClosePanel
  | SetGoldenLayout
  | ClearGoldenLayout;
