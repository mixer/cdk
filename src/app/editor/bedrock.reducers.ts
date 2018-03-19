import { ActionReducerMap } from '@ngrx/store';
import * as fromLayout from './layout/layout.reducer';

export interface State {
  state: fromLayout.State,
}

export const reducers: ActionReducerMap<any> = {
};
