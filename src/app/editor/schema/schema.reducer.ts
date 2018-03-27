import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { IGroup, IParticipant } from '@mcph/miix-std/dist/internal';
import * as fromRoot from '../bedrock.reducers';
import {
  initialControls,
  initialGroups,
  initialParticipant,
  IWorld,
  SchemaActions,
  SchemaActionTypes,
} from './schema.actions';

export interface ISchemaState {
  groups: IGroup[];
  participant: IParticipant;
  worldSchema: IWorld;
}

export interface IState extends fromRoot.IState {
  contentMask: ISchemaState;
}

const initialState: ISchemaState = {
  groups: initialGroups,
  participant: initialParticipant,
  worldSchema: { scenes: <any>initialControls },
};

export function schemaReducer(
  state: ISchemaState = initialState,
  action: SchemaActions,
): ISchemaState {
  switch (action.type) {
    case SchemaActionTypes.UPDATE_GROUPS:
      return { ...state, groups: action.groups };
    case SchemaActionTypes.UPDATE_PARTICIPANT:
      return { ...state, participant: action.participant };
    case SchemaActionTypes.UPDATE_WORLD_SCHEMA:
      return { ...state, worldSchema: action.world };
    default:
      return state;
  }
}

/**
 * Selector for the schema feature.
 */
export const contentMaskState: MemoizedSelector<IState, ISchemaState> = createFeatureSelector<
  ISchemaState
>('schema');

/**
 * Selects the current groups.
 */
export const selectGroups = createSelector(contentMaskState, s => s.groups);

/**
 * Selects the current participant.
 */
export const selectParticipant = createSelector(contentMaskState, s => s.participant);

/**
 * Selects the current world.
 */
export const selectWorld = createSelector(contentMaskState, s => s.worldSchema);
