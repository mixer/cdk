/**
 * Orientation is given to size() to determine the device orientation.
 * Landscape is the default orientation.
 */
export const enum Orientation {
  Landscape = 'landscape',
  Portrait = 'portrait',
}

/**
 * IFrameState is the state is the editor's frame display.
 */
export interface IFrameState {
  chosenDevice: number;
  width: number;
  height: number;
  dimensionsManuallySet: boolean;
  orientation: Orientation;
  controlsReady: boolean;
  isMasked: boolean;
}

export const enum Action {
  Select = 'FRAME_SELECT',
  SetDimensions = 'FRAME_SET_DIMENSIONS',
  Rotate = 'FRAME_ROTATE',
  SetReady = 'FRAME_SET_READY',
  Mask = 'FRAME_MASK',
}

export const initialState = {
  chosenDevice: 0,
  width: -1,
  height: -1,
  dimensionsManuallySet: false,
  orientation: Orientation.Portrait,
  controlsReady: true,
  isMasked: false,
};

export function reducer(state: IFrameState, action: any): IFrameState {
  switch (action.type) {
    case Action.Select:
      return {
        ...state,
        chosenDevice: action.index,
        width: -1,
        height: -1,
        dimensionsManuallySet: false,
        orientation: Orientation.Landscape,
      };
    case Action.SetDimensions:
      return {
        ...state,
        dimensionsManuallySet: action.isManual,
        width: action.width || state.width,
        height: action.height || state.height,
      };
    case Action.Rotate:
      return {
        ...state,
        dimensionsManuallySet: false,
        orientation:
          state.orientation === Orientation.Landscape
            ? Orientation.Portrait
            : Orientation.Landscape,
      };
    case Action.SetReady:
      return {
        ...state,
        controlsReady: action.isReady,
      };
    case Action.Mask:
      return {
        ...state,
        isMasked: action.isMasked,
      };
    default:
      return state;
  }
}
