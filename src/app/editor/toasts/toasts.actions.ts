import { Action } from '@ngrx/store';

export const enum ToastActionTypes {
  CREATE_TOAST_COMPONENT = '[Toasts] Create Component',
}

/**
 * Base class that toasts extend so that typing information is available.
 */
export class Toastable<T> {
  /**
   * To avoid issue about unused generic :)
   */
  protected isToastable(_obj: T): void {
    // noop
  }
}

/**
 * Opens a new toast by component.
 */
export class OpenToast<T> implements Action {
  public readonly type = ToastActionTypes.CREATE_TOAST_COMPONENT;

  constructor(
    public readonly component: new (...args: any[]) => Toastable<T>,
    public readonly data: T,
  ) {}
}

export type ToastActions = OpenToast<any>;
