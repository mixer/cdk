import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatDialogModule,
  MatListModule,
  MatProgressSpinnerModule,
} from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MomentModule } from 'angular2-moment';

import { AccountModule } from '../account/account.module';
import { ToastsModule } from '../toasts/toasts.module';
import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { UploaderModule } from '../uploader/uploader.module';
import { LinkProjectDialogComponent } from './link-dialog/link-dialog.component';
import { ProjectDropdownComponent } from './project-dropdown/project-dropdown.component';
import { ProjectEffects } from './project.effects';
import { projectReducer } from './project.reducer';

/**
 * Holds state and effects about the currently open controls project.
 */
@NgModule({
  imports: [
    ToastsModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MenuBarModule,
    MatButtonModule,
    AccountModule,
    UploaderModule,
    MatDialogModule,
    MomentModule,
    EffectsModule.forFeature([ProjectEffects]),
    StoreModule.forFeature('project', projectReducer),
  ],
  declarations: [ProjectDropdownComponent, LinkProjectDialogComponent],
  entryComponents: [LinkProjectDialogComponent],
  exports: [ProjectDropdownComponent],
})
export class ProjectModule {}
