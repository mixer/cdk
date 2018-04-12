import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatCheckboxModule, MatDialogModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ProjectModule } from '../project/project.module';
import { AdvancedToggleModule } from '../ui/advanced-toggle/advanced-toggle.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { UploaderConfirmingComponent } from './uploader-confirming/uploader-confirming.component';
import { UploaderConsoleService } from './uploader-console.service';
import { UploaderDialogComponent } from './uploader-dialog/uploader-dialog.component';
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
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    ProjectModule,
    ReactiveFormsModule,
    StoreModule.forFeature('uploader', uploaderReducer),
  ],
  entryComponents: [UploaderDialogComponent],
  providers: [UploaderConsoleService],
  declarations: [UploaderDialogComponent, UploaderConfirmingComponent],
})
export class UploaderModule {}
