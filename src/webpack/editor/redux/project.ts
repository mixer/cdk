import { Injectable } from '@angular/core';
import { ActionReducer, Store } from '@ngrx/store';
import * as patch from 'fast-json-patch';

import * as Code from './code';
import * as Frame from './frame';

const enum Action {
  Undo = 'UNDO',
  Redo = 'REDO',
}

const undoableActions = [
  Frame.Action.Rotate,
  Frame.Action.Select,
  Code.Action.SetState, // so they aren't ever undoing something on a screen they can't see
  Code.Action.SetParticipant,
  Code.Action.SetControls,
];

/**
 * Undo/redo history.
 */
export interface IHistoryState {
  behind: patch.Operation[][];
  ahead: patch.Operation[][];
}

/**
 * IProject is the application state for the project.
 */
export interface IProject {
  history: IHistoryState;
  frame: Frame.IFrameState;
}

/**
 * ProjectService provides notation on the IProject state.
 */
@Injectable()
export class ProjectService {
  constructor(private store: Store<IProject>) {}

  // History actions ----------------------------------------------------------

  /**
   * Steps back in history.
   */
  public undo() {
    this.store.dispatch({ type: Action.Undo });
  }

  /**
   * Moves forwards in history.
   */
  public redo() {
    this.store.dispatch({ type: Action.Redo });
  }

  // Frame actions ------------------------------------------------------------

  /**
   * Change the selected device.
   */
  public chooseDevice(deviceIndex: number) {
    this.store.dispatch({ type: Frame.Action.Select, index: deviceIndex });
  }

  /**
   * Rotate the device.
   */
  public rotateDevice() {
    this.store.dispatch({ type: Frame.Action.Rotate });
  }

  /**
   * Manually override the device dimensions, called by the user.
   */
  public resizeDevice(width?: number, height?: number) {
    this.store.dispatch({ type: Frame.Action.SetDimensions, width, height, isManual: true });
  }

  /**
   * Sets the displayed dimensions of the device. Called automatically when
   * the device is changed or the window is resized.
   */
  public setDeviceDisplayedSize(width: number, height: number) {
    this.store.dispatch({ type: Frame.Action.SetDimensions, width, height, isManual: false });
  }
}

function compare(from: IProject, to: IProject): patch.Operation[] {
  return patch.compare({ ...from, history: <any>null }, { ...to, history: <any>null });
}

/**
 * Maximum amount of history states to keep/
 */
const maxHistoryRecords = 500;

function moveHistory(project: IProject, direction: Action.Undo | Action.Redo): IProject {
  const { ahead, behind } = project.history;

  if (direction === Action.Undo && behind.length > 0) {
    const next = patch.applyPatch(patch.deepClone(project), behind[behind.length - 1]).newDocument;
    next.history = {
      ahead: ahead.concat([compare(next, project)]),
      behind: behind.slice(0, -1),
    };

    return next;
  }

  if (direction === Action.Redo && ahead.length > 0) {
    const prev = patch.applyPatch(patch.deepClone(project), ahead[ahead.length - 1]).newDocument;
    prev.history = {
      behind: behind.concat([compare(prev, project)]),
      ahead: ahead.slice(0, -1),
    };

    return prev;
  }

  return project;
}

function storeHistory(previous: IProject, next: IProject, action: any): IProject {
  if (undoableActions.indexOf(action.type) === -1) {
    return next;
  }

  const adjust = Math.max(0, next.history.behind.length - maxHistoryRecords);

  return {
    ...next,
    history: {
      ahead: [],
      behind: next.history.behind
        .slice(adjust, maxHistoryRecords)
        .concat([compare(next, previous)]),
    },
  };
}

/**
 * Initial state of the project.
 */
const initialState: IProject = {
  history: {
    ahead: [],
    behind: [],
  },
  frame: {
    chosenDevice: 0,
    width: -1,
    height: -1,
    dimensionsManuallySet: false,
    orientation: Frame.Orientation.Portrait,
  },
};

/**
 * historyReducer is a metareducer that enabled undo/redo history on the state.
 */
export function historyReducer(
  reducer: ActionReducer<IProject, any>,
): ActionReducer<IProject, any> {
  return (project = initialState, action) => {
    switch (action.type) {
      case Action.Undo:
        return moveHistory(project, Action.Undo);
      case Action.Redo:
        return moveHistory(project, Action.Redo);
      default:
        return storeHistory(project, reducer(project, action), action);
    }
  };
}

/**
 * ngrx store reducers.
 */
export const reducers: { [key in keyof IProject]?: Function } = {
  frame: Frame.reducer,
  history: (s: IProject) => s,
};

/**
 * ngrx metareducers
 */
export const metaReducers = [historyReducer];
