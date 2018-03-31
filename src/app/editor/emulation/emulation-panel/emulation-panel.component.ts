import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { devices, IDevice } from '../devices';
import {
  IEffectiveDimensions,
  RotateDevice,
  SetDevice,
  SetEffectiveDimensions,
  SetLanguage,
} from '../emulation.actions';
import { selectDevice, selectEffectiveDimensions, selectLanguage } from '../emulation.reducer';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'emulation-panel',
  templateUrl: './emulation-panel.component.html',
  styleUrls: ['./emulation-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmulationPanelComponent {
  /**
   * Template hoist.
   */
  public readonly devices = devices;

  /**
   * Selects the displayed device.
   */
  public readonly device = this.store.select(selectDevice);

  /**
   * Selects the selected locale.
   */
  public readonly language = this.store.select(selectLanguage);

  /**
   * Selects the effective device dimensions.
   */
  public readonly dimensions = this.store.select(selectEffectiveDimensions);

  /**
   * Whether the user is currently editing dimensions, creating a "custom"
   * device type.
   */
  public readonly isCustomDevice = this.dimensions.pipe(map(d => d && d.wasManual));

  constructor(private readonly store: Store<fromRoot.IState>) {}

  /**
   * Rotates the displayed vice.
   */
  public rotate() {
    this.store.dispatch(new RotateDevice());
  }

  /**
   * Updates the device width.
   */
  public setWidth(width: number) {
    this.updateDimensions({ width });
  }

  /**
   * Updates the device height.
   */
  public setHeight(height: number) {
    this.updateDimensions({ height });
  }

  /**
   * Updates the chosen device.
   */
  public chooseDevice(device: IDevice) {
    this.store.dispatch(new SetDevice(device));
  }

  /**
   * Updates the locale.
   */
  public setLocale(language: string) {
    this.store.dispatch(new SetLanguage(language));
  }

  private updateDimensions(partial: Partial<IEffectiveDimensions>) {
    this.dimensions.pipe(take(1), filter(d => !!d)).subscribe(dimensions => {
      this.store.dispatch(
        new SetEffectiveDimensions({
          ...dimensions!,
          ...partial,
          wasManual: true,
        }),
      );
    });
  }
}
