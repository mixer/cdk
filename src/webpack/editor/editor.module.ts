import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MdButtonModule,
  MdIconModule,
  MdInputModule,
  MdSelectModule,
  MdTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CodeComponent } from './code/code.component';
import { FrameComponent } from './frame/frame.component';
import { HostComponent } from './host/host.component';
import { CodeNavComponent } from './nav/code-nav.component';
import { NavComponent } from './nav/nav.component';
import { metaReducers, ProjectService, reducers } from './redux/project';

require('../../../static/editor/style.scss');

/**
 * Primary Editor application.
 */
@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    HttpModule,
    FormsModule,
    MdButtonModule,
    MdIconModule,
    MdInputModule,
    MdSelectModule,
    MdTooltipModule,
    StoreModule.forRoot(reducers, { metaReducers }),
  ],
  declarations: [CodeComponent, CodeNavComponent, FrameComponent, HostComponent, NavComponent],
  providers: [ProjectService],
  bootstrap: [HostComponent],
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule); // tslint:disable-line
