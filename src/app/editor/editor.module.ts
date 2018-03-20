import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MatIconModule } from '@angular/material';

import { BytesPipe } from './shared/bytes.pipe';
import { SafePipe } from './shared/safe.pipe';
import { reducers } from './bedrock.reducers';
import { BedrockComponent } from './bedrock.component';
import { LayoutModule } from './layout/layout.module';

/**
 * Primary Editor application.
 */
@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    MatIconModule,
    LayoutModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([]),
  ],
  declarations: [BytesPipe, SafePipe, BedrockComponent],
  providers: [],
  bootstrap: [BedrockComponent],
})
export class AppModule {}
