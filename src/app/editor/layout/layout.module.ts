import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { AboutModule } from '../about/about.module';
import { AccountModule } from '../account/account.module';
import { ControlsConsoleModule } from '../controls-console/controls-console.module';
import { ControlsModule } from '../controls/controls.module';
import { NewProjectModule } from '../new-project/new-project.module';
import { ProjectModule } from '../project/project.module';
import { SchemaModule } from '../schema/schema.module';
import { SharedModule } from '../shared/shared.module';
import { MenuBarModule } from '../ui/menu-bar/menu-bar.module';
import { ControlSchemaComponent } from './control-schema/control-schema.component';
import { GoldenComponent } from './golden/golden.component';
import { GoldenService } from './golden/golden.service';
import { LayoutEffects } from './layout.effects';
import { layoutReducer } from './layout.reducer';
import { TopNavComponent } from './topnav/topnav.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { WorkspaceComponent } from './workspace/workspace.component';

/**
 * Module for foundational, common layout components.
 */
@NgModule({
  imports: [
    AboutModule,
    AccountModule,
    CommonModule,
    ControlsConsoleModule,
    ControlsModule,
    EffectsModule.forFeature([LayoutEffects]),
    HttpClientModule, // necessary for icons
    MatIconModule,
    MenuBarModule,
    NewProjectModule,
    ProjectModule,
    SchemaModule,
    SharedModule,
    StoreModule.forFeature('layout', layoutReducer),
  ],
  exports: [WorkspaceComponent],
  providers: [GoldenService],
  declarations: [
    TopNavComponent,
    WelcomeComponent,
    WorkspaceComponent,
    GoldenComponent,
    ControlSchemaComponent,
  ],
  entryComponents: [ControlSchemaComponent],
})
export class LayoutModule {}
