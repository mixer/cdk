import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { devices } from '../frame/devices';
import { IProject, ProjectService } from '../redux/project';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  public frame = this.store.select('frame');
  public canRotate = this.frame.map(s => devices[s.chosenDevice].canRotate);
  public devices = devices;

  public canUndo = this.store.select(s => s.history.behind.length > 0);
  public canRedo = this.store.select(s => s.history.ahead.length > 0);

  constructor(private project: ProjectService, private store: Store<IProject>) {}

  public chooseDevice(index: number) {
    this.project.chooseDevice(index);
  }

  public rotateDevice() {
    this.project.rotateDevice();
  }

  public setWidth(width: number) {
    this.project.resizeDevice(width);
  }

  public setHeight(height: number) {
    this.project.resizeDevice(undefined, height);
  }

  public undo() {
    this.project.undo();
  }

  public redo() {
    this.project.redo();
  }
}
