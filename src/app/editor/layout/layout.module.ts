import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { AccountModule } from '../account/account.module';
import { NewProjectModule } from '../new-project/new-project.module';
import { SharedModule } from '../shared/shared.module';
import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { layoutReducer } from './layout.reducer';
import { TopNavComponent } from './topnav/topnav.component';

/**
 * Module for foundational, common layout components.
 */
@NgModule({
  imports: [
    AccountModule,
    CommonModule,
    NewProjectModule,
    SharedModule,
    MenuBarModule,
    StoreModule.forFeature('layout', layoutReducer),
  ],
  exports: [TopNavComponent],
  declarations: [TopNavComponent],
})
export class LayoutModule {}
