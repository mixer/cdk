import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { AppConfig } from './editor.config';
import * as fromLayout from './layout/layout.reducer';

export interface IState {
  state: fromLayout.IState;
}

export const reducers: ActionReducerMap<any> = {};

export function logger(reducer: ActionReducer<IState>): ActionReducer<IState> {
  return function(state: IState, action: any): IState {
    const start = performance.now();
    const next = reducer(state, action);
    // tslint:disable-next-line
    console.debug('ngrx:', action.type, {
      from: state,
      to: next,
      delta: `${(performance.now() - start).toFixed(2)}ms`,
    });
    return next;
  };
}

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<IState>[] = AppConfig.production ? [] : [logger];
