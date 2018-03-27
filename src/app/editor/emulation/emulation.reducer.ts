import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { devices, IDevice } from './devices';
import {
  EmulationActions,
  EmulationActionTypes,
  IEffectiveDimensions,
  Orientation,
} from './emulation.actions';

export interface IEmulationState {
  orientation: Orientation;
  device: IDevice;
  effectiveDimensions?: IEffectiveDimensions;
}

export interface IState extends fromRoot.IState {
  emulation: IEmulationState;
}

const initialState: IEmulationState = {
  device: devices[0],
  orientation: Orientation.Landscape,
};

export function emulationReducer(
  state: IEmulationState = initialState,
  action: EmulationActions,
): IEmulationState {
  switch (action.type) {
    case EmulationActionTypes.SET_DEVICE:
      return {
        device: action.device,
        orientation: action.device.canRotate ? state.orientation : Orientation.Landscape,
      };
    case EmulationActionTypes.SET_ORIENTATION:
      return {
        ...state,
        orientation:
          state.orientation === Orientation.Landscape
            ? Orientation.Portrait
            : Orientation.Landscape,
      };
    case EmulationActionTypes.SET_EFFECTIVE_DIMENSIONS:
      return { ...state, effectiveDimensions: action.dimensions };
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
 * Selects the chosen orientation.
 */
export const orientation = createSelector(emulationState, s => s.orientation);

/**
 * Selects whether the user has manually set dimensions for the given device.
 */
export const selectEffectiveDimensions = createSelector(emulationState, s => s.effectiveDimensions);
