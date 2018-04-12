import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BytesPipe } from './bytes.pipe';
import { IframeSrcDirective } from './iframe-src.directive';
import { KeysPipe } from './keys.pipe';
import { OpenExternalDirective } from './open-external.directive';
import { SafePipe } from './safe.pipe';

/**
 * Contains the bits and pieces too small for their own modules.
 */
@NgModule({
  imports: [CommonModule],
  declarations: [SafePipe, BytesPipe, OpenExternalDirective, IframeSrcDirective, KeysPipe],
  exports: [SafePipe, BytesPipe, OpenExternalDirective, IframeSrcDirective, KeysPipe],
})
export class SharedModule {}
