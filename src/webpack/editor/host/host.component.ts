import { NgRedux } from '@angular-redux/store';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { devices } from '../frame/devices';
import { Action, IProject } from '../redux/project';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostComponent {
  public selectedDevice = this.ngRedux.select<number>(['frame', 'chosenDevice']);
  public devices = devices;

  constructor(private ngRedux: NgRedux<IProject>) {}

  public chooseDevice(index: number) {
    this.ngRedux.dispatch({
      type: Action.Frame.Select,
      index: index,
    });
  }
}
