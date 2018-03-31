import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { BedrockComponent } from './bedrock.component';
import { BedrockEffects } from './bedrock.effects';
import { metaReducers, reducers } from './bedrock.reducers';
import { ElectronService } from './electron.service';
import { IssueService } from './issue.service';
import { LayoutModule } from './layout/layout.module';
import { RaygunModule } from './raygun/raygun.module';

/**
 * Primary Editor application.
 */
@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    EffectsModule.forRoot([BedrockEffects]),
    LayoutModule,
    MatIconModule,
    RaygunModule,
    StoreModule.forRoot(reducers, { metaReducers }),
  ],
  declarations: [BedrockComponent],
  providers: [IssueService, ElectronService],
  bootstrap: [BedrockComponent],
})
export class AppModule {}
