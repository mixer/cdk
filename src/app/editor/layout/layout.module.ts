import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';

import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { layoutReducer } from './layout.reducer';
import { TopNavComponent } from './topnav/topnav.component';

@NgModule({
  imports: [CommonModule, MenuBarModule, StoreModule.forFeature('layout', layoutReducer)],
  exports: [TopNavComponent],
  declarations: [TopNavComponent],
})
export class LayoutModule {}
