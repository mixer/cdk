import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { Action, Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { Toastable } from '../toasts.actions';

/**
 * Passed to ErrorToastComponent.
 */
export interface IErrorData {
  /**
   * Error message to display.
   */
  message: string;
  /**
   * If given, a retry button will be shown
   * which will fire the action when clicked.
   */
  retry?: Action;
}

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'error-toast',
  templateUrl: './error-toast.component.html',
  styleUrls: ['../toast.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorToastComponent extends Toastable<IErrorData> {
  constructor(
    public readonly ref: MatSnackBarRef<any>,
    @Inject(MAT_SNACK_BAR_DATA) public readonly data: IErrorData,
    private readonly store: Store<fromRoot.IState>,
  ) {
    super();
  }

  public retry() {
    if (this.data.retry) {
      this.store.dispatch(this.data.retry);
      this.ref.dismiss();
    }
  }
}
