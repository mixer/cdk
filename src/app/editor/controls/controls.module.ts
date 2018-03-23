import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { controlReducer } from './controls.reducer';

@NgModule({
  imports: [
    EffectsModule.forFeature([ProjectEffects]),
    StoreModule.forFeature('controls', controlReducer),
  ],
})
export class ProjectModule {}
