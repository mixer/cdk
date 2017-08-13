import { NgRedux, NgReduxModule } from '@angular-redux/store'; // <- New
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MdButtonModule, MdInputModule, MdSelectModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FrameComponent } from './frame/frame.component';
import { HostComponent } from './host/host.component';
import { initialState, IProject, reducer } from './redux/project';

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
    MdButtonModule,
    MdInputModule,
    MdSelectModule,
    NgReduxModule,
  ],
  declarations: [FrameComponent, HostComponent],
  bootstrap: [HostComponent],
})
export class AppModule {
  constructor(ngRedux: NgRedux<IProject>) {
    ngRedux.configureStore(reducer, initialState);
  }
}
platformBrowserDynamic().bootstrapModule(AppModule); // tslint:disable-line
