import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatDialogModule } from '@angular/material';
import { StoreModule } from '@ngrx/store';

import { RadioIconsModule } from '../ui/radio-icons/radio-icons.module';
import { LayoutSelectionComponent } from './layout-selection/layout-selection.component';
import { NewProjectDialogComponent } from './new-project-dialog/new-project-dialog.component';
import { newProjectReducer } from './new-project.reducer';
import { NewProjectService } from './new-project.service';
import { WelcomeScreenComponent } from './welcome-screen/welcome-screen.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    RadioIconsModule,
    StoreModule.forFeature('newProject', newProjectReducer),
  ],
  entryComponents: [NewProjectDialogComponent],
  providers: [NewProjectService],
  declarations: [NewProjectDialogComponent, WelcomeScreenComponent, LayoutSelectionComponent],
})
export class NewProjectModule {}
