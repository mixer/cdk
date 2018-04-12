import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { ContentMaskActions, ContentMaskActionTypes } from './content-mask.actions';

export interface IContentMaskState {
  open: boolean;
}

export interface IState extends fromRoot.IState {
  contentMask: IContentMaskState;
}

export function contentMaskReducer(
  state: IContentMaskState = { open: false },
  action: ContentMaskActions,
): IContentMaskState {
  switch (action.type) {
    case ContentMaskActionTypes.OPEN_MASK:
      return { ...state, open: true };
    case ContentMaskActionTypes.CLOSE_MASK:
      return { ...state, open: false };
    default:
      return state;
  }
}

/**
 * Selector for the contentMask feature.
 */
export const contentMaskState: MemoizedSelector<IState, IContentMaskState> = createFeatureSelector<
  IContentMaskState
>('contentMask');

/**
 * Selects whether the mask is open.
 */
export const isOpen = createSelector(contentMaskState, s => s.open);
