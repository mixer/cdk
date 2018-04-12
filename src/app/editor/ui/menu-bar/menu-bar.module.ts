import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material';
import { StoreModule } from '@ngrx/store';

import {
  MenuBarComponent,
  MenuBarDividerComponent,
  MenuBarIconComponent,
  MenuBarItemComponent,
  MenuBarItemsComponent,
  MenuBarTextComponent,
} from './menu-bar.component';
import { menuBarReducer } from './menu-bar.reducer';

/**
 * Module for simple, "File/Edit/etc" style menus.
 */
@NgModule({
  imports: [CommonModule, MatIconModule, StoreModule.forFeature('menuBar', menuBarReducer)],
  exports: [
    MenuBarItemsComponent,
    MenuBarTextComponent,
    MenuBarComponent,
    MenuBarDividerComponent,
    MenuBarIconComponent,
    MenuBarItemComponent,
  ],
  declarations: [
    MenuBarItemsComponent,
    MenuBarTextComponent,
    MenuBarComponent,
    MenuBarDividerComponent,
    MenuBarIconComponent,
    MenuBarItemComponent,
  ],
})
export class MenuBarModule {}
