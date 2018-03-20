import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { MatIconModule } from '@angular/material';

import {
  MenuBarComponent,
  MenuBarDividerComponent,
  MenuBarItemComponent,
  MenuBarTextComponent,
  MenuBarItemsComponent,
} from './menu-bar.component';
import { menuBarReducer } from './menu-bar.reducer';

@NgModule({
  imports: [CommonModule, MatIconModule, StoreModule.forFeature('menuBar', menuBarReducer)],
  exports: [MenuBarItemsComponent, MenuBarTextComponent, MenuBarComponent, MenuBarDividerComponent, MenuBarItemComponent],
  declarations: [MenuBarItemsComponent, MenuBarTextComponent, MenuBarComponent, MenuBarDividerComponent, MenuBarItemComponent],
})
export class MenuBarModule {}
