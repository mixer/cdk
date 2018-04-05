import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule, MatDialogModule, MatInputModule, ErrorStateMatcher } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ProjectModule } from '../project/project.module';
import { AdvancedToggleModule } from '../ui/advanced-toggle/advanced-toggle.module';
import { ConsoleModule } from '../ui/console-display/console-display.module';
import { RadioIconsModule } from '../ui/radio-icons/radio-icons.module';
import { AttributeSelectionComponent } from './attribute-selection/attribute-selection.component';
import { CompleteComponent } from './complete/complete.component';
import { CreatingComponent } from './creating/creating.component';
import { LayoutSelectionComponent } from './layout-selection/layout-selection.component';
import { NewProjectDialogComponent } from './new-project-dialog/new-project-dialog.component';
import { NewProjectEffects } from './new-project.effects';
import { newProjectReducer } from './new-project.reducer';
import { NewProjectService } from './new-project.service';
import { TemplateSelectionComponent } from './template-selection/template-selection.component';
import { WelcomeScreenComponent } from './welcome-screen/welcome-screen.component';

const errorStateMatcher = { isErrorState: (ctrl:FormControl) => ctrl.invalid };

/**
 * Module containing wizardry for creating a new project.
 */
@NgModule({
  imports: [
    AdvancedToggleModule,
    CommonModule,
    ConsoleModule,
    EffectsModule.forFeature([NewProjectEffects]),
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    RadioIconsModule,
    ReactiveFormsModule,
    ProjectModule,
    StoreModule.forFeature('newProject', newProjectReducer),
  ],
  entryComponents: [NewProjectDialogComponent],
  providers: [
    NewProjectService,
    {provide: ErrorStateMatcher, useValue: errorStateMatcher },
  ],
  declarations: [
    NewProjectDialogComponent,
    WelcomeScreenComponent,
    CreatingComponent,
    LayoutSelectionComponent,
    TemplateSelectionComponent,
    CompleteComponent,
    AttributeSelectionComponent,
  ],
})
export class NewProjectModule {}
