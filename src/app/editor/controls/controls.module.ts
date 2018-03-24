import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ConsoleModule } from '../ui/console-display/console-display.module';
import { ControlEffects } from './control.effects';
import { ControlsBootstrapComponent } from './controls-bootstrap/controls-bootstrap.component';
import { ControlsConsoleService } from './controls-console.service';
import { ControlsPanelComponent } from './controls-panel/controls-panel.component';
import { controlReducer } from './controls.reducer';

/**
 * Handles display and state of the custom controls.
 */
@NgModule({
  imports: [
    CommonModule,
    ConsoleModule,
    MatProgressSpinnerModule,
    EffectsModule.forFeature([ControlEffects]),
    StoreModule.forFeature('controls', controlReducer),
  ],
  providers: [ControlsConsoleService],
  declarations: [ControlsBootstrapComponent, ControlsPanelComponent],
  exports: [ControlsPanelComponent],
  entryComponents: [ControlsPanelComponent],
})
export class ControlsModule {}
