import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatDialogModule,
  MatInputModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ControlsConsoleModule } from '../controls-console/controls-console.module';
import { EmulationModule } from '../emulation/emulation.module';
import { SharedModule } from '../shared/shared.module';
import { AdvancedToggleModule } from '../ui/advanced-toggle/advanced-toggle.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { RemoteConnectionChooseChannelComponent } from './choose-channel/choose-channel.component';
import { RemoteConnectionErrorComponent } from './connection-error/connection-error.component';
import { RemoteConnectionDialogComponent } from './dialog/dialog.component';
import { RemoteConnectEffects } from './remote-connect.effects';
import { remoteConnectReducer } from './remote-connect.reducer';
import { RemoteConnectionVersionConflictComponent } from './version-conflict/version-conflict.component';
import { RemoteConnectionWaitingClientComponent } from './waiting-client/waiting-client.component';

/**
 * Handles the process and state of control connections to the remote
 * channel.
 */
@NgModule({
  imports: [
    AdvancedToggleModule,
    BrowserAnimationsModule,
    CommonModule,
    ConsoleModule,
    ControlsConsoleModule,
    EffectsModule.forFeature([RemoteConnectEffects]),
    EmulationModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatProgressSpinnerModule,
    SharedModule,
    StoreModule.forFeature('remoteConnect', remoteConnectReducer),
  ],
  declarations: [
    RemoteConnectionDialogComponent,
    RemoteConnectionErrorComponent,
    RemoteConnectionChooseChannelComponent,
    RemoteConnectionWaitingClientComponent,
    RemoteConnectionVersionConflictComponent,
  ],
  entryComponents: [RemoteConnectionDialogComponent],
})
export class RemoteConnectModule {}
