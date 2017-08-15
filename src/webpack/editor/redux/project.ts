import * as Frame from './frame';
import { Action as ReduxAction } from 'redux';

export interface IBoundReducer<S> {
  type: any;
  property: keyof IProject;
  reducer(lastState: S, action: ReduxAction): S;
}

/**
 * Holy typescript! The general idea of this is to create an object to delegate
 * to a nested reducer. The reducer operates on a `property` of the generate
 * IProperty structure. You pass the enum of `state`s that the nested reducer
 * takes care of, as well as the reducer function.
 *
 * Consumers can call the reducer by applying what appear to be top-level
 * actions, like `Action.Frame.Select`, and they'll get dispatched down
 * to the nested reducer automatically.
 */
function bindReducer<T, K extends keyof IProject>(
  property: K,
  state: T,
  reducerFn: (lastState: IProject[K], action: ReduxAction) => IProject[K],
): { [key in keyof T]: IBoundReducer<IProject[K]> } {
  const output: { [key in keyof T]?: IBoundReducer<IProject[K]> } = {};
  Object.keys(state).forEach((key: keyof T) => {
    output[key] = { reducer: reducerFn, property, type: state[key] };
  });

  return <any>output;
}

/**
 * InstrinicActions are handled at a top-level in the project's reducer
 * (reduceInstrinic) rather than delegating to a nested reducer.
 */
const enum InstrinsicAction {
  Back,
  Forwards,
}

/**
 * Nested enum of actions that can be executed in the editor.
 */
export const Action = {
  // tslint:disable-line
  Frame: bindReducer('frame', Frame.Action, Frame.reducer),
  History: {
    Back: InstrinsicAction.Back,
    Forwards: InstrinsicAction.Forwards,
  },
};

/**
 * IProject is the application state for the project.
 */
export interface IProject {
  history: IProject[];
  historyPtr: number;
  frame: Frame.IFrameState;
}

export const initialState: IProject = {
  history: [],
  historyPtr: 0,
  frame: Frame.defaultState,
};

/**
 * Number of items we'll keep in the Redux history.
 */
const maxHistoryLength = 500;

/**
 * reduceIntrinsic handles top-level macroscopic actions as
 * defined in InstrinicAction.
 */
function reduceIntrinsic(lastState: IProject, action: { type: InstrinsicAction }): IProject {
  switch (action.type) {
    case InstrinsicAction.Back:
      if (lastState.historyPtr > 0) {
        return {
          ...lastState.history[lastState.historyPtr - 1],
          history: lastState.history,
          historyPtr: lastState.historyPtr - 1,
        };
      }
      break;
    case InstrinsicAction.Forwards:
      if (lastState.historyPtr < lastState.history.length) {
        return {
          ...lastState.history[lastState.historyPtr + 1],
          history: lastState.history,
          historyPtr: lastState.historyPtr - 1,
        };
      }
      break;
  }

  return lastState;
}

/**
 * reduceBound dispatches an action for a bound, nested reducer. It pushes
 * the changed state to the project's history.
 */
function reduceBound(lastState: IProject, action: { type: IBoundReducer<any> }): IProject {
  const nested = action.type;
  const adjust = Math.max(0, lastState.historyPtr - maxHistoryLength);

  return {
    ...lastState,
    [nested.property]: nested.reducer(lastState[nested.property], { ...action, type: nested.type }),
    historyPtr: lastState.historyPtr + 1 - adjust,
    history: lastState.history
      .slice(adjust, lastState.historyPtr)
      .concat({ ...lastState, history: [] }), // wipe history to avoid ^2 memory usage
  };
}

export function reducer(
  lastState: IProject,
  action: { type: IBoundReducer<any> | InstrinsicAction },
): IProject {
  const nested = action.type;

  if (typeof nested === 'number') {
    return reduceIntrinsic(lastState, <{ type: InstrinsicAction }>action);
  }

  // Skip things that don't duck into bound reducers.
  if (typeof nested.reducer !== 'function' || typeof nested.property !== 'string') {
    return lastState;
  }

  return reduceBound(lastState, <{ type: IBoundReducer<any> }>action);
}
