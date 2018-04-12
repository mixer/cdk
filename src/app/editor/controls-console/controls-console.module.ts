import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MomentModule } from 'angular2-moment';

import { SharedModule } from '../shared/shared.module';
import { ControlsControlsPanelComponent } from './controls-console-panel/controls-console-panel.component';
import { ControlsConsoleEffects } from './controls-console.effects';
import { controlsConsoleReducer } from './controls-console.reducer';
import { ControlsRemoteConsoleService } from './controls-remote-console.service';
import { ExpandedMessageComponent } from './expanded-message/expanded-message.component';

/**
 * Module that displays output of logs and errors from the user's controls.
 */
@NgModule({
  imports: [
    CommonModule,
    EffectsModule.forFeature([ControlsConsoleEffects]),
    FormsModule,
    MatIconModule,
    MomentModule,
    SharedModule,
    StoreModule.forFeature('controlsConsole', controlsConsoleReducer),
  ],
  providers: [ControlsRemoteConsoleService],
  declarations: [ControlsControlsPanelComponent, ExpandedMessageComponent],
  entryComponents: [ControlsControlsPanelComponent],
})
export class ControlsConsoleModule {}
