import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import * as fromRoot from '../bedrock.reducers';
import { devices, IDevice } from './devices';
import {
  EmulationActions,
  EmulationActionTypes,
  IEffectiveDimensions,
  Orientation,
} from './emulation.actions';

export interface IEmulationState {
  /**
   * Currently chosen orientation.
   */
  orientation: Orientation;

  /**
   * Currently chosen device.
   */
  device: IDevice;

  /**
   * The dimensions of the emulated area currently displayed. Can be set
   * automatically by selecting a device, or manually.
   */
  effectiveDimensions?: IEffectiveDimensions;

  /**
   * The rect of the vidoe relative to the controls within the emulation frame.
   */
  fittedVideo?: ClientRect;

  /**
   * Options the controls send to move where the video is displayed on screen.
   */
  movedVideo: IVideoPositionOptions;

  /**
   * The locale to emulate.
   */
  language: string;
}

export interface IState extends fromRoot.IState {
  emulation: IEmulationState;
}

const initialState: IEmulationState = {
  device: devices[0],
  orientation: Orientation.Landscape,
  language: navigator.language,
  movedVideo: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

export function emulationReducer(
  state: IEmulationState = initialState,
  action: EmulationActions,
): IEmulationState {
  switch (action.type) {
    case EmulationActionTypes.SET_DEVICE:
      return {
        ...initialState,
        device: action.device,
        orientation: action.device.canRotate ? state.orientation : Orientation.Landscape,
        language: state.language,
      };
    case EmulationActionTypes.ROTATE_DEVICE:
      return {
        ...state,
        orientation:
          state.orientation === Orientation.Landscape
            ? Orientation.Portrait
            : Orientation.Landscape,
      };
    case EmulationActionTypes.SET_EFFECTIVE_DIMENSIONS:
      return { ...state, effectiveDimensions: action.dimensions };
    case EmulationActionTypes.SET_FITTED_VIDEO_SIZE:
      return { ...state, fittedVideo: action.rect };
    case EmulationActionTypes.MOVE_VIDEO:
      return { ...state, movedVideo: action.options };
    case EmulationActionTypes.SET_LANGUAGE:
      return { ...state, language: action.language };
    default:
      return state;
  }
}

/**
 * Selector for the emulation feature.
 */
export const emulationState: MemoizedSelector<IState, IEmulationState> = createFeatureSelector<
  IEmulationState
>('emulation');

/**
 * Selects the chosen device.
 */
export const selectDevice = createSelector(emulationState, s => s.device);

/**
 * Selects the chosen language.
 */
export const selectLanguage = createSelector(emulationState, s => s.language);

/**
 * Selects the chosen orientation.
 */
export const orientation = createSelector(emulationState, s => s.orientation);

/**
 * Selects whether the user has manually set dimensions for the given device.
 */
export const selectEffectiveDimensions = createSelector(emulationState, s => s.effectiveDimensions);

/**
 * Selects whether the user has manually set dimensions for the given device.
 */
export const selectedMovedVideo = createSelector(emulationState, s => s.movedVideo);

/**
 * Selects whether the user has manually set dimensions for the given device.
 */
export const selectedFittedVideo = createSelector(emulationState, s => s.fittedVideo);
