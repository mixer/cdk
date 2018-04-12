import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { Store } from '@ngrx/store';

import { ReportRpcError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { RpcError } from '../../electron.service';
import { Toastable } from '../toasts.actions';

/**
 * Passed to ErrorToastComponent.
 */
export interface IErrorData {
  message: string;
  error: RpcError;
}

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'rpc-toast',
  templateUrl: './rpc-toast.component.html',
  styleUrls: ['../toast.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RpcToastComponent extends Toastable<IErrorData> {
  constructor(
    public readonly ref: MatSnackBarRef<any>,
    @Inject(MAT_SNACK_BAR_DATA) public readonly data: IErrorData,
    private readonly store: Store<fromRoot.IState>,
  ) {
    super();
  }

  public report() {
    this.store.dispatch(new ReportRpcError(this.data.message, this.data.error));
    this.ref.dismiss();
  }
}
