import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AdvancedToggleComponent } from './advanced-toggle.component';

/**
 * Module for a spoiler-style toggle.
 */
@NgModule({
  exports: [AdvancedToggleComponent, CommonModule],
  declarations: [AdvancedToggleComponent],
})
export class AdvancedToggleModule {}
