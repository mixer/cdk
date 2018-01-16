import { IFilter } from '../console/console.service';

/**
 * IConsoleState determines what's displayed in the console right now.
 */
export interface IConsoleState {
  filter: IFilter;
}

export const enum Action {
  SetFilter = 'CONSOLE_FILTER',
}

export const initialState = {
  filter: {
    pattern: '',
    kinds: {},
  },
};

export function reducer(state: IConsoleState, action: any): IConsoleState {
  switch (action.type) {
    case Action.SetFilter:
      return { ...state, filter: action.filter };
    default:
      return state;
  }
}
