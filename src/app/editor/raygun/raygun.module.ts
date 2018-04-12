import { ErrorHandler, NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { RaygunEffects } from './raygun-effects';
import { RaygunErrorHandler } from './raygun-error-handler';

/**
 * The RaygunModule propogates telemetry about errors and usage.
 */
@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useClass: RaygunErrorHandler,
    },
  ],
  imports: [EffectsModule.forFeature([RaygunEffects])],
})
export class RaygunModule {}
