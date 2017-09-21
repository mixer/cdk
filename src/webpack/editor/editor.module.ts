import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MdButtonModule,
  MdDialogModule,
  MdIconModule,
  MdInputModule,
  MdSelectModule,
  MdSnackBarModule,
  MdTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CodeComponent } from './code/code.component';
import { FrameControlsComponent } from './frame/frame-controls.component';
import { FrameComponent } from './frame/frame.component';
import { LocalControlsComponent } from './frame/local-controls.component';
import { RemoteControlsComponent } from './frame/remote-controls.component';
import { HostComponent } from './host/host.component';
import { ChannelSelectDialog } from './launch-dialog/channel-select-dialog.component';
import { LaunchDialogComponent } from './launch-dialog/launch-dialog.component';
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
    FormsModule,
    HttpModule,
    MdButtonModule,
    MdDialogModule,
    MdIconModule,
    MdInputModule,
    MdSelectModule,
    MdSnackBarModule,
    MdTooltipModule,
    StoreModule.forRoot(<any>reducers, { metaReducers }),
  ],
  declarations: [
    ChannelSelectDialog,
    CodeComponent,
    CodeNavComponent,
    FrameComponent,
    FrameControlsComponent,
    HostComponent,
    LaunchDialogComponent,
    LocalControlsComponent,
    NavComponent,
    RemoteControlsComponent,
  ],
  entryComponents: [ChannelSelectDialog, LaunchDialogComponent],
  providers: [ProjectService],
  bootstrap: [HostComponent],
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule); // tslint:disable-line
