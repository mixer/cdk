import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatDialogModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../shared/shared.module';
import { AdvancedToggleModule } from '../ui/advanced-toggle/advanced-toggle.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { UploaderCompletedComponent } from './uploader-completed/uploader-completed.component';
import { UploaderConfirmingComponent } from './uploader-confirming/uploader-confirming.component';
import { UploaderConsoleService } from './uploader-console.service';
import { UploaderDialogComponent } from './uploader-dialog/uploader-dialog.component';
import { UploaderLinkingGameComponent } from './uploader-linking-game/uploader-linking-game.component';
import { UploaderUploadingControls } from './uploader-uploading-controls/uploader-uploading-controls.component';
import { UploaderUploadingSchema } from './uploader-uploading-schema/uploader-uploading-schema.component';
import { UploaderEffects } from './uploader.effects';
import { uploaderReducer } from './uploader.reducer';

/**
 * Module containing the flow to upload a control bundle to Mixer.
 */
@NgModule({
  imports: [
    AdvancedToggleModule,
    CommonModule,
    ConsoleModule,
    EffectsModule.forFeature([UploaderEffects]),
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    SharedModule,
    StoreModule.forFeature('uploader', uploaderReducer),
  ],
  entryComponents: [UploaderDialogComponent],
  providers: [UploaderConsoleService],
  declarations: [
    UploaderCompletedComponent,
    UploaderConfirmingComponent,
    UploaderDialogComponent,
    UploaderLinkingGameComponent,
    UploaderUploadingControls,
    UploaderUploadingControls,
    UploaderUploadingSchema,
  ],
})
export class UploaderModule {}
