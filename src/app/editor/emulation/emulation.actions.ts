import { Action } from '@ngrx/store';
import { IDevice } from './devices';

/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export const enum Orientation {
  Landscape = 'landscape',
  Portrait = 'portrait',
}

/**
 * Represents the dimensions of the displayed device in pixels. Contains
 * true if the size was set by hand.
 */
export interface IEffectiveDimensions {
  width: number;
  height: number;
  wasManual: boolean;
}

export const enum EmulationActionTypes {
  SET_DEVICE = '[Emulation] Set Device',
  SET_ORIENTATION = '[Emulation] Set Orientation',
  SET_EFFECTIVE_DIMENSIONS = '[Emulation] Set Effective Dimensions',
}

/**
 * Sets the device to use for emulation.
 */
export class SetDevice implements Action {
  public readonly type = EmulationActionTypes.SET_DEVICE;

  constructor(public readonly device: IDevice) {}
}

/**
 * Sets the device orientation.
 */
export class SetOrientation implements Action {
  public readonly type = EmulationActionTypes.SET_ORIENTATION;

  constructor(public readonly orientation: Orientation) {}
}

/**
 * Sets the displayed device dimensions.
 */
export class SetEffectiveDimensions implements Action {
  public readonly type = EmulationActionTypes.SET_EFFECTIVE_DIMENSIONS;

  constructor(public readonly dimensions: IEffectiveDimensions) {}
}

export type EmulationActions = SetDevice | SetOrientation | SetEffectiveDimensions;
