import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from '../shared/shared.module';
import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { AccountLinkingService } from './account-linking.service';
import { AccountSwitcherComponent } from './account-switcher/account-switcher.component';
import { AccountEffects } from './account.effects';
import { accountReducer } from './account.reducer';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { LoginWalkthroughComponent } from './login-walkthrough/login-walkthrough.component';

/**
 * Module for account-related adminstration.
 */
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MenuBarModule,
    SharedModule,
    StoreModule.forFeature('account', accountReducer),
    EffectsModule.forFeature([AccountEffects]),
  ],
  exports: [AccountSwitcherComponent, LoginWalkthroughComponent],
  declarations: [AccountSwitcherComponent, LoginDialogComponent, LoginWalkthroughComponent],
  providers: [AccountLinkingService],
  entryComponents: [LoginDialogComponent],
})
export class AccountModule {}
