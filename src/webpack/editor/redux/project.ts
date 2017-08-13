import * as Frame from './frame';

export interface IBoundReducer<S> {
  type: any;
  property: keyof IProject;
  reducer(lastState: S, action: any): S;
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
  reducerFn: (lastState: IProject[K], action: any) => IProject[K],
): { [key in keyof T]: IBoundReducer<IProject[K]> } {
  const output: { [key in keyof T]?: IBoundReducer<IProject[K]> } = {};
  Object.keys(state).forEach((key: keyof T) => {
    output[key] = { reducer: reducerFn, property, type: state[key] };
  });

  return <any>output;
}

/**
 * Nested enum of actions that can be executed in the editor.
 */
export const Action = { // tslint:disable-line
  Frame: bindReducer('frame', Frame.Action, Frame.reducer),
};

/**
 * IProject is the application state for the project.
 */
export interface IProject {
  frame: Frame.IFrameState;
}

export const initialState: IProject = {
  frame: Frame.defaultState,
};

export function reducer(lastState: IProject, action: { type: IBoundReducer<any> }): IProject {
  const nested = action.type;

  // Skip things that don't duck into bound reducers.
  if (typeof nested.type !== 'function' || typeof nested.property !== 'string') {
    return lastState;
  }

  return {
    ...lastState,
    [nested.property]: nested.reducer(lastState[nested.property], { ...action, type: nested.type }),
  };
}
