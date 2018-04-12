import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
} from '@angular/material';
import { StoreModule } from '@ngrx/store';

import { EmulationContainerComponent } from './emulation-container/emulation-container.component';
import { EmulationPanelComponent } from './emulation-panel/emulation-panel.component';
import { emulationReducer } from './emulation.reducer';

/**
 * Module for simple, "File/Edit/etc" style menus.
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    StoreModule.forFeature('emulation', emulationReducer),
    MatOptionModule,
    MatSelectModule,
  ],
  exports: [EmulationContainerComponent],
  declarations: [EmulationContainerComponent, EmulationPanelComponent],
  entryComponents: [EmulationPanelComponent],
})
export class EmulationModule {}
