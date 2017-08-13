/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export const enum Orientation {
  Landscape,
  Portrait,
}

/**
 * IFrameState is the state is the editor's frame display.
 */
export interface IFrameState {
  chosenDevice: number;
  widthOverride: number;
  heightOverride: number;
  orientation: Orientation;
}

export const defaultState: IFrameState = {
  chosenDevice: 0,
  widthOverride: -1,
  heightOverride: -1,
  orientation: Orientation.Landscape,
};

export enum Action {
  Select,
  OverrideDimensions,
}

export function reducer(lastState: IFrameState, action: any): IFrameState {
  switch (action.type) {
    case Action.Select:
      return {
        chosenDevice: action.index,
        widthOverride: -1,
        heightOverride: -1,
        orientation: Orientation.Landscape,
      };
    case Action.OverrideDimensions:
      return {
        ...lastState,
        widthOverride: action.width,
        heightOverride: action.height,
      };
    default:
      return lastState;
  }
}
