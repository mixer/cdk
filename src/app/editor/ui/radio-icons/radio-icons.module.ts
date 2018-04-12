import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { RadioIconComponent, RadioIconListComponent } from './radio-icon.component';

/**
 * Exports components that offer the ability to select from a list,
 * in a nice graphical way. Used most notably in the quickstart flow.
 */
@NgModule({
  imports: [CommonModule, SharedModule],
  exports: [RadioIconComponent, RadioIconListComponent],
  declarations: [RadioIconComponent, RadioIconListComponent],
})
export class RadioIconsModule {}
