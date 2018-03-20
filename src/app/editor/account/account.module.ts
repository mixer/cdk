import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { MatDialogModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';

import { accountReducer } from './account.reducer';
import { AccountSwitcherComponent } from './account-switcher/account-switcher.component';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { LoginWalkthroughComponent } from './login-walkthrough/login-walkthrough.component';
import { AccountLinkingService } from './account-linking.service';
import { AccountEffects } from './account.effects';
import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MenuBarModule,
    SharedModule,
    StoreModule.forFeature('account', accountReducer),
    EffectsModule.forFeature([AccountEffects]),
  ],
  exports: [
    AccountSwitcherComponent,
    LoginWalkthroughComponent,
  ],
  declarations: [
    AccountSwitcherComponent,
    LoginDialogComponent,
    LoginWalkthroughComponent,
  ],
  providers: [
    AccountLinkingService,
  ],
  entryComponents: [
    LoginDialogComponent,
  ],
})
export class AccountModule {}
