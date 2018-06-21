import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ErrorStateMatcher,
  MatButtonModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../shared/shared.module';
import { AdvancedToggleModule } from '../ui/advanced-toggle/advanced-toggle.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { UploaderCompilationErrorComponent } from './uploader-compilation-error/uploader-compilation-error.component';
import { UploaderCompletedComponent } from './uploader-completed/uploader-completed.component';
import { UploaderConfirmingComponent } from './uploader-confirming/uploader-confirming.component';
import { UploaderConsoleService } from './uploader-console.service';
import { UploaderDialogComponent } from './uploader-dialog/uploader-dialog.component';
import { UploaderLinkingGameComponent } from './uploader-linking-game/uploader-linking-game.component';
import { UploaderRenameComponent } from './uploader-rename/uploader-rename.component';
import { UploaderUploadingControls } from './uploader-uploading-controls/uploader-uploading-controls.component';
import { UploaderUploadingSchema } from './uploader-uploading-schema/uploader-uploading-schema.component';
import { UploaderEffects } from './uploader.effects';
import { uploaderReducer } from './uploader.reducer';

const errorStateMatcher = { isErrorState: (ctrl: FormControl) => ctrl.invalid };

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
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SharedModule,
    StoreModule.forFeature('uploader', uploaderReducer),
  ],
  entryComponents: [UploaderDialogComponent],
  providers: [UploaderConsoleService, { provide: ErrorStateMatcher, useValue: errorStateMatcher }],
  declarations: [
    UploaderCompilationErrorComponent,
    UploaderCompletedComponent,
    UploaderConfirmingComponent,
    UploaderDialogComponent,
    UploaderLinkingGameComponent,
    UploaderRenameComponent,
    UploaderUploadingControls,
    UploaderUploadingControls,
    UploaderUploadingSchema,
  ],
})
export class UploaderModule {}
