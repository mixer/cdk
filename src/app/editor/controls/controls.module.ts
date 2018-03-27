import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../shared/shared.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { ControlEffects } from './control.effects';
import { ControlsBootstrapComponent } from './controls-bootstrap/controls-bootstrap.component';
import { ControlsConsoleService } from './controls-console.service';
import { ControlsPanelComponent } from './controls-panel/controls-panel.component';
import { controlReducer } from './controls.reducer';
import { LocalControlsComponent } from './local-controls/local-controls.component';
import { WebpackConsolePanelComponent } from './webpack-console-panel/webpack-console-panel.component';

/**
 * Handles display and state of the custom controls.
 */
@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    ConsoleModule,
    EffectsModule.forFeature([ControlEffects]),
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule,
    StoreModule.forFeature('controls', controlReducer),
  ],
  providers: [ControlsConsoleService],
  declarations: [
    ControlsBootstrapComponent,
    ControlsPanelComponent,
    WebpackConsolePanelComponent,
    LocalControlsComponent,
  ],
  exports: [ControlsPanelComponent, WebpackConsolePanelComponent],
  entryComponents: [ControlsPanelComponent, WebpackConsolePanelComponent],
})
export class ControlsModule {}
