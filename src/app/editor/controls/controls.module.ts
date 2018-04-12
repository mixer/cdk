import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ControlsConsoleModule } from '../controls-console/controls-console.module';
import { EmulationModule } from '../emulation/emulation.module';
import { SharedModule } from '../shared/shared.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { ControlEffects } from './control.effects';
import { ControlsControlsComponent } from './controls-controls/controls-controls.component';
import { ControlsPanelComponent } from './controls-panel/controls-panel.component';
import { ControlsWebpackConsoleService } from './controls-webpack-console.service';
import { controlReducer } from './controls.reducer';
import { LocalControlsComponent } from './local-controls/local-controls.component';
import { BaseStateSyncService } from './sync/base-state-sync.service';
import { WebpackConfigLocatorModalComponent } from './webpack-config-locator-modal/webpack-config-locator-modal.component';
import { WebpackConsolePanelComponent } from './webpack-console-panel/webpack-console-panel.component';

/**
 * Handles display and state of the custom controls.
 */
@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    ConsoleModule,
    ControlsConsoleModule,
    EffectsModule.forFeature([ControlEffects]),
    EmulationModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule,
    StoreModule.forFeature('controls', controlReducer),
  ],
  providers: [BaseStateSyncService, ControlsWebpackConsoleService],
  declarations: [
    ControlsControlsComponent,
    ControlsPanelComponent,
    WebpackConsolePanelComponent,
    LocalControlsComponent,
    WebpackConfigLocatorModalComponent,
  ],
  exports: [ControlsPanelComponent, WebpackConsolePanelComponent],
  entryComponents: [
    ControlsPanelComponent,
    WebpackConsolePanelComponent,
    WebpackConfigLocatorModalComponent,
  ],
})
export class ControlsModule {}
