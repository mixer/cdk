import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BytesPipe } from './bytes.pipe';
import { OpenExternalDirective } from './open-external.directive';
import { SafePipe } from './safe.pipe';

/**
 * Contains the bits and pieces too small for their own modules.
 */
@NgModule({
  imports: [CommonModule],
  declarations: [SafePipe, BytesPipe, OpenExternalDirective],
  exports: [SafePipe, BytesPipe, OpenExternalDirective],
})
export class SharedModule {}
