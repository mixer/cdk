import { Action } from '@ngrx/store';

export const enum ContentMaskActionTypes {
  OPEN_MASK = '[ContentMask] Open Mask',
  CLOSE_MASK = '[ContentMask] Close Mask',
}

/**
 * Closes the current mask.
 */
export class CloseMask implements Action {
  public readonly type = ContentMaskActionTypes.CLOSE_MASK;
}

/**
 * Opens the current mask.
 */
export class OpenMask implements Action {
  public readonly type = ContentMaskActionTypes.OPEN_MASK;
}

export type ContentMaskActions = OpenMask | CloseMask;
