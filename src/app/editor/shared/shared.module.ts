import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BytesPipe } from './bytes.pipe';
import { OpenExternalDirective } from './open-external.directive';
import { SafePipe } from './safe.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [SafePipe, BytesPipe, OpenExternalDirective],
  exports: [SafePipe, BytesPipe, OpenExternalDirective],
})
export class SharedModule {}
