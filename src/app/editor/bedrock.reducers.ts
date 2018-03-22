import { ActionReducerMap } from '@ngrx/store';
import * as fromLayout from './layout/layout.reducer';

export interface IState {
  state: fromLayout.IState;
}

export const reducers: ActionReducerMap<any> = {};
