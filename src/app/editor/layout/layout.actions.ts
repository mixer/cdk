import { Action } from '@ngrx/store';
import * as GoldenLayout from 'golden-layout';

export const enum LayoutScreen {
  Welcome,
  Editor,
}

export enum GoldenPanel {
  ControlSchema = 'ControlSchema',
  Controls = 'Controls',
  WebpackConsole = 'WebpackConsole',
  DeviceEmulation = 'DeviceEmulation',
}

export const panelTitles: { [k in GoldenPanel]: string } = {
  [GoldenPanel.ControlSchema]: 'Control Schema',
  [GoldenPanel.Controls]: 'Controls',
  [GoldenPanel.WebpackConsole]: 'Webpack Console',
  [GoldenPanel.DeviceEmulation]: 'Device Emulation',
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
 * Tries to bring the content item into focus. Returns true if it's successful.
 */
export function focus(panel: GoldenLayout.ContentItem): boolean {
  if (
    panel.parent &&
    panel.parent.getActiveContentItem &&
    panel.parent.getActiveContentItem() !== panel
  ) {
    panel.parent.setActiveContentItem(panel);
    return true;
  }

  return false;
}

/**
 * Tries to bring the content item into focus. Returns true if it's successful.
 */
export function focusGolden(root: GoldenLayout.ContentItem, panel: GoldenPanel): boolean {
  const contentItem = findGoldenPanel([root], panel);
  if (!contentItem) {
    return false;
  }

  return focus(contentItem);
}

/**
 * Finds the content panel matching the predicate.
 */
export function findPanel(
  items: GoldenLayout.ContentItem[],
  predicate: (item: GoldenLayout.ContentItem) => boolean,
): GoldenLayout.ContentItem | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (predicate(item)) {
      return item;
    }

    if (item.contentItems) {
      const found = findPanel(item.contentItems, predicate);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Attempts to find the ContentItem matching the given golden panel name.
 */
export function findGoldenPanel(items: GoldenLayout.ContentItem[], panel: GoldenPanel) {
  return findPanel(items, p => p.isComponent && (<any>p).componentName === panel);
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
 * Triggers a panel to be opened in the layout. Optionally created with a
 * locator, which should return the parent component the new panel should
 * be opened within.
 */
export class OpenPanel implements Action {
  public readonly type = LayoutActionTypes.OPEN_PANEL;

  constructor(
    public readonly panel: GoldenPanel,
    public readonly locator?: (fn: GoldenLayout) => GoldenLayout.ContentItem | null,
  ) {}
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
