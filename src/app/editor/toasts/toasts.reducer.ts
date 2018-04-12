import * as fromRoot from '../bedrock.reducers';
import { ToastActions } from './toasts.actions';

// tslint:disable-next-line
export interface IToastState {}

export interface IState extends fromRoot.IState {
  toasts: IToastState;
}

export function toastReducer(state: IToastState, _action: ToastActions): IToastState {
  return state;
}
