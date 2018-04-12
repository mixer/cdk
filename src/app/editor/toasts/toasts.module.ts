import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatSnackBarModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ErrorToastComponent } from './error-toast/error-toast.component';
import { RpcToastComponent } from './rpc-toast/rpc-toast.component';
import { ToastEffects } from './toasts.effects';
import { toastReducer } from './toasts.reducer';

/**
 * Displays alerts about state.
 */
@NgModule({
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    EffectsModule.forFeature([ToastEffects]),
    StoreModule.forFeature('toasts', toastReducer),
  ],
  declarations: [ErrorToastComponent, RpcToastComponent],
  entryComponents: [ErrorToastComponent, RpcToastComponent],
})
export class ToastsModule {}
