import { IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
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
  ROTATE_DEVICE = '[Emulation] Rotate device',
  SET_EFFECTIVE_DIMENSIONS = '[Emulation] Set Effective Dimensions',
  SET_FITTED_VIDEO_SIZE = '[Emulation] Set Fitted Video Size',
  SET_LANGUAGE = '[Emulation] Set langauge',
  MOVE_VIDEO = '[Emulation] Move Video',
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
export class RotateDevice implements Action {
  public readonly type = EmulationActionTypes.ROTATE_DEVICE;
}

/**
 * Sets the displayed device dimensions.
 */
export class SetEffectiveDimensions implements Action {
  public readonly type = EmulationActionTypes.SET_EFFECTIVE_DIMENSIONS;

  constructor(public readonly dimensions: IEffectiveDimensions) {}
}

/**
 * Sets the fitted video position within the controls.
 */
export class SetFittedVideoSize implements Action {
  public readonly type = EmulationActionTypes.SET_FITTED_VIDEO_SIZE;

  constructor(public readonly rect: ClientRect) {}
}

/**
 * Moves the video position, called by the controls.
 */
export class MoveVideo implements Action {
  public readonly type = EmulationActionTypes.MOVE_VIDEO;

  constructor(public readonly options: IVideoPositionOptions) {}
}

/**
 * Sets the control language.
 */
export class SetLanguage implements Action {
  public readonly type = EmulationActionTypes.SET_LANGUAGE;

  constructor(public readonly language: string) {}
}

export type EmulationActions =
  | SetDevice
  | RotateDevice
  | SetEffectiveDimensions
  | SetFittedVideoSize
  | MoveVideo
  | SetLanguage;
