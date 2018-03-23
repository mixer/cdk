import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ProjectEffects } from './project.effects';
import { projectReducer } from './project.reducer';

/**
 * Holds state and effects about the currently open controls project.
 */
@NgModule({
  imports: [
    EffectsModule.forFeature([ProjectEffects]),
    StoreModule.forFeature('project', projectReducer),
  ],
})
export class ProjectModule {}
