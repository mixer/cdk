import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BytesPipe } from './bytes.pipe';
import { IframeSrcDirective } from './iframe-src.directive';
import { OpenExternalDirective } from './open-external.directive';
import { SafePipe } from './safe.pipe';

/**
 * Contains the bits and pieces too small for their own modules.
 */
@NgModule({
  imports: [CommonModule],
  declarations: [SafePipe, BytesPipe, OpenExternalDirective, IframeSrcDirective],
  exports: [SafePipe, BytesPipe, OpenExternalDirective, IframeSrcDirective],
})
export class SharedModule {}
