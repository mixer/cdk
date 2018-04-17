import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as GoldenLayout from 'golden-layout';
import { IRecentProject } from '../../../server/recent-projects';
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
  panels: GoldenLayout.ItemConfigType[];
  goldenLayout: null | GoldenLayout;
  recent: null | IRecentProject[];
}

export interface IState extends fromRoot.IState {
  layout: ILayoutState;
}

const initialState: ILayoutState = {
  screen: LayoutScreen.Welcome,
  goldenLayout: null,
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
  recent: [],
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
    case LayoutActionTypes.SET_GOLDEN_LAYOUT:
      return { ...state, goldenLayout: action.layout };
    case LayoutActionTypes.CLEAR_GOLDEN_LAYOUT:
      return { ...state, goldenLayout: null };
    case LayoutActionTypes.GET_RECENT_PROJECTS:
      return { ...state, recent: action.projects || null };
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
 * Selects the golden layout.
 */
export const goldenLayout = createSelector(layoutState, s => s.goldenLayout);

/**
 * Selects the recent projects.
 */
export const getRecentProjects = createSelector(layoutState, s => s.recent);

/**
 * Selects whether the given panel is open in the current layout.
 */
export const panelIsOpen = (panelName: GoldenPanel) =>
  createSelector(layoutState, s => {
    const walk = (panels: GoldenLayout.ItemConfigType[]): boolean => {
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
