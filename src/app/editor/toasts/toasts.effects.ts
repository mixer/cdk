import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material';
import { OpenToast, ToastActionTypes } from './toasts.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class ToastEffects {
  /**
   * Fired when we want to pick a project directory to open.
   */
  @Effect({ dispatch: false })
  public readonly openComponent = this.actions
    .ofType<OpenToast<any>>(ToastActionTypes.CREATE_TOAST_COMPONENT)
    .pipe(tap(action => this.snack.openFromComponent(action.component, { data: action.data })));

  constructor(private readonly actions: Actions, private readonly snack: MatSnackBar) {}
}
