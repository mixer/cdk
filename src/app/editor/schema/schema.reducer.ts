import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { IGroup, IParticipant } from '@mixer/cdk-std/dist/internal';
import * as fromRoot from '../bedrock.reducers';
import {
  initialGroups,
  initialParticipant,
  initialWorld,
  ISnapshot,
  IWorld,
  SchemaActions,
  SchemaActionTypes,
} from './schema.actions';

export interface ISchemaState {
  groups: IGroup[];
  participant: IParticipant;
  worldSchema: IWorld;
  snapshots: ISnapshot[];
  loadedSnapshot?: string;
}

export interface IState extends fromRoot.IState {
  contentMask: ISchemaState;
}

const initialState: ISchemaState = {
  groups: initialGroups,
  participant: initialParticipant,
  snapshots: [],
  worldSchema: initialWorld,
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
    case SchemaActionTypes.DELETE_SNAPSHOT:
      return { ...state, snapshots: state.snapshots.filter(s => s.name !== action.name) };
    case SchemaActionTypes.SNAPSHOT_CREATED:
      return {
        ...state,
        snapshots: state.snapshots
          .filter(s1 => !action.snapshots.some(s2 => s2.name === s1.name))
          .concat(action.snapshots)
          .sort((s1, s2) => s2.savedAt - s1.savedAt),
      };
    case SchemaActionTypes.LOAD_SNAPSHOT:
      return { ...state, worldSchema: action.snapshot.world, loadedSnapshot: action.snapshot.name };
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

/**
 * Selects all snapshots persisted to the server.
 */
export const selectAllSnapshots = createSelector(contentMaskState, s => s.snapshots);

/**
 * Selects the currently loaded snapshot, if any.
 */
export const selectLoadedSnapshot = createSelector(contentMaskState, s => s.loadedSnapshot);
