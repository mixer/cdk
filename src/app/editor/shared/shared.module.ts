import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SafePipe } from './safe.pipe';
import { BytesPipe } from './bytes.pipe';
import { OpenExternalDirective } from './open-external.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    SafePipe,
    BytesPipe,
    OpenExternalDirective,
  ],
  exports: [
    SafePipe,
    BytesPipe,
    OpenExternalDirective,
  ],
})
export class SharedModule {}
