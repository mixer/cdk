import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MdButtonModule,
  MdCheckboxModule,
  MdDialogModule,
  MdExpansionModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdMenuModule,
  MdSelectModule,
  MdSnackBarModule,
  MdTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { BundleUploadService } from './bundle-upload.service';
import { CodeComponent } from './code/code.component';
import { FrameControlsComponent } from './frame/frame-controls.component';
import { FrameComponent } from './frame/frame.component';
import { LocalControlsComponent } from './frame/local-controls.component';
import { RemoteControlsComponent } from './frame/remote-controls.component';
import { HostComponent } from './host/host.component';
import { HttpErrorService } from './http-error.service';
import { ChannelSelectDialog } from './launch-dialog/channel-select-dialog.component';
import { LaunchDialogComponent } from './launch-dialog/launch-dialog.component';
import { LinkDialogComponent } from './link-dialog/link-dialog.component';
import { LoginWalkthroughComponent } from './login-walkthrough/login-walkthrough.component';
import { CodeNavComponent } from './nav/code-nav.component';
import { NavComponent } from './nav/nav.component';
import { metaReducers, ProjectService, reducers } from './redux/project';
import { RenameBundleDialogComponent } from './rename-bundle-dialog/rename-bundle-dialog.component';
import { UploadSchemaDialogComponent } from './upload-schema/upload-schema-dialog.component';
import { UploadSchemaService } from './upload-schema/upload-schema.service';

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
    MdCheckboxModule,
    MdDialogModule,
    MdExpansionModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdMenuModule,
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
    LinkDialogComponent,
    LocalControlsComponent,
    LoginWalkthroughComponent,
    NavComponent,
    RemoteControlsComponent,
    UploadSchemaDialogComponent,
    RenameBundleDialogComponent,
  ],
  entryComponents: [
    ChannelSelectDialog,
    LinkDialogComponent,
    LaunchDialogComponent,
    UploadSchemaDialogComponent,
    RenameBundleDialogComponent,
  ],
  providers: [BundleUploadService, ProjectService, UploadSchemaService, HttpErrorService],
  bootstrap: [HostComponent],
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule); // tslint:disable-line
