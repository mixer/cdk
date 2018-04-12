import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../shared/shared.module';
import { InstallNodeModalComponent } from './install-node-modal/install-node-modal.component';
import { PreflightEffects } from './preflight.effects';
import { preflightReducer } from './preflight.reducer';

/**
 * The PreflightModule runs checks when the editor starts to make sure the
 * necessary programs and data are installed.
 */
@NgModule({
  imports: [
    EffectsModule.forFeature([PreflightEffects]),
    StoreModule.forFeature('preflight', preflightReducer),
    MatDialogModule,
    CommonModule,
    SharedModule,
  ],
  declarations: [InstallNodeModalComponent],
  entryComponents: [InstallNodeModalComponent],
})
export class PreflightModule {}
