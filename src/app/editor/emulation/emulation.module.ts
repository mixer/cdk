import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { EmulationContainerComponent } from './emulation-container/emulation-container.component';
import { emulationReducer } from './emulation.reducer';

/**
 * Module for simple, "File/Edit/etc" style menus.
 */
@NgModule({
  imports: [CommonModule, StoreModule.forFeature('emulation', emulationReducer)],
  exports: [EmulationContainerComponent],
  declarations: [EmulationContainerComponent],
})
export class EmulationModule {}
