import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { MatIconModule } from '@angular/material';

import { MenuBarComponent, MenuBarDividerComponent, MenuBarItemComponent } from './menu-bar.component';
import { menuBarReducer } from './menu-bar.reducer';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    StoreModule.forFeature('menuBar', menuBarReducer)
  ],
  exports: [
    MenuBarComponent,
    MenuBarDividerComponent,
    MenuBarItemComponent,
  ],
  declarations: [
    MenuBarComponent,
    MenuBarDividerComponent,
    MenuBarItemComponent,
  ],
})
export class MenuBarModule { }
