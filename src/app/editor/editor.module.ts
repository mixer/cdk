import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { BedrockComponent } from './bedrock.component';
import { reducers } from './bedrock.reducers';
import { ElectronService } from './electron.service';
import { LayoutModule } from './layout/layout.module';

/**
 * Primary Editor application.
 */
@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    EffectsModule.forRoot([]),
    LayoutModule,
    MatIconModule,
    StoreModule.forRoot(reducers),
  ],
  declarations: [BedrockComponent],
  providers: [ElectronService],
  bootstrap: [BedrockComponent],
})
export class AppModule {}
