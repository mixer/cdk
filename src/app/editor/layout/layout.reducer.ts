import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { ItemConfigType } from 'golden-layout';
import * as fromRoot from '../bedrock.reducers';
import {
  GoldenPanel,
  LayoutActions,
  LayoutActionTypes,
  LayoutScreen,
  panelTitles,
} from './layout.actions';

export interface ILayoutState {
  screen: LayoutScreen;
  panels: ItemConfigType[];
}

export interface IState extends fromRoot.IState {
  layout: ILayoutState;
}

const initialState: ILayoutState = {
  screen: LayoutScreen.Welcome,
  panels: [
    {
      type: 'row',
      content: [
        {
          type: 'component',
          componentName: GoldenPanel.ControlSchema,
          title: panelTitles[GoldenPanel.ControlSchema],
          width: 1 / 4,
        },
        {
          type: 'component',
          componentName: GoldenPanel.Controls,
          title: panelTitles[GoldenPanel.Controls],
          width: 3 / 4,
        },
      ],
    },
  ],
};

export function layoutReducer(
  state: ILayoutState = initialState,
  action: LayoutActions,
): ILayoutState {
  switch (action.type) {
    case LayoutActionTypes.OPEN_SCREEN:
      return { ...state, screen: action.screen };
    case LayoutActionTypes.PANELS_SAVE:
      return { ...state, panels: action.panels };
    default:
      return state;
  }
}

/**
 * Selector for the layout feature.
 */
export const layoutState: MemoizedSelector<IState, ILayoutState> = createFeatureSelector<
  ILayoutState
>('layout');

/**
 * Selects the chosen layout screen.
 */
export const selectScreen = createSelector(layoutState, s => s.screen);

/**
 * Selector whether the state is on the editor, or now.
 */
export const isOnEditor = createSelector(layoutState, s => s.screen === LayoutScreen.Editor);

/**
 * Selects displayed golden layout panels.
 */
export const goldenPanels = createSelector(layoutState, s => s.panels);

/**
 * Selects whether the given panel is open in the current layout.
 */
export const panelIsOpen = (panelName: GoldenPanel) =>
  createSelector(layoutState, s => {
    const walk = (panels: ItemConfigType[]): boolean => {
      return panels.some(panel => {
        if (panel.type === 'component' && (<any>panel).componentName === panelName) {
          return true;
        }

        if (panel.content instanceof Array) {
          return walk(panel.content);
        }

        return false;
      });
    };

    return walk(s.panels);
  });
