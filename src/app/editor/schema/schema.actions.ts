import { IGroup, IParticipant, IScene } from '@mixer/cdk-std/dist/internal';
import { Action } from '@ngrx/store';
import { RpcError } from '../electron.service';
import { IInteractiveGame } from '../project/project.actions';

export const enum SchemaActionTypes {
  UPDATE_WORLD_SCHEMA = '[Schema] Update World Schema',
  UPDATE_PARTICIPANT = '[Schema] Update Participant',
  UPDATE_GROUPS = '[Schema] Update Groups',
  SAVE_SNAPSHOT = '[Schema] Save snapshot',
  LOAD_SNAPSHOT = '[Schema] Load snapshot',
  SNAPSHOT_CREATED = '[Schema] Snapshot created',
  DELETE_SNAPSHOT = '[Schema] Delete snapshot',
  COPY_WORLD_FROM_GAME = '[Schema] Copy world schema from game',
  UPLOAD_WORLD_TO_GAME = '[Schema] Upload world schema to game',
  UPLOAD_WORLD_COMPLETE = '[Schema] World upload complete',
  UPLOAD_WORLD_FAILED = '[Schema] World upload failed',
  QUICK_UPLOAD_WORLD = '[Schema] Quick upload world',
}

export const enum SchemaMethod {
  SaveSnapshot = '[Schema] Save snapshots',
  DeleteSnapshot = '[Schema] Delete snapshot',
  ListSnapshots = '[Schema] List Snapshots',
  GetGameVersionDetails = '[Schema] Get details about a game version',
  SetGameSchema = '[Schema] Set control schema for a game',
}

export interface IWorld {
  scenes: IScene[];
}

export interface ISnapshot {
  world: IWorld;
  name: string;
  savedAt: number;
}

export const initialParticipant = {
  sessionID: 'e1fefc78-d4cc-4c69-b2d9-b36ed5c52893',
  userID: 1,
  username: 'Mr_Tester',
  level: 42,
  lastInputAt: Date.now(),
  connectedAt: Date.now(),
  disabled: false,
  groupID: 'default',
  sparks: 500,
};

export const initialGroups = [
  {
    groupID: 'default',
    sceneID: 'default',
  },
];

export const initialWorld: IWorld = <any>{
  scenes: [
    {
      sceneID: 'default',
      controls: [
        {
          controlID: 'my_first_button',
          kind: 'button',
          text: 'My First Button',
          cost: 100,
          progress: 0.5,
          disabled: true,
          position: [
            {
              width: 10,
              height: 8,
              size: 'large',
              x: 0,
              y: 0,
            },
            {
              width: 10,
              height: 8,
              size: 'medium',
              x: 0,
              y: 0,
            },
          ],
        },
        {
          controlID: 'my_awesome_joystick',
          kind: 'joystick',
          disabled: true,
          angle: 0.7,
          intensity: 0.5,
          position: [
            {
              width: 7,
              height: 7,
              size: 'large',
              x: 11,
              y: 0,
            },
            {
              width: 7,
              height: 7,
              size: 'medium',
              x: 11,
              y: 0,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Default name of the "work in progress" snapshot.
 */
export const workingSnapshoptName = '$working';

/**
 * Updates the current world schema.
 */
export class UpdateWorldSchema implements Action {
  public readonly type = SchemaActionTypes.UPDATE_WORLD_SCHEMA;

  constructor(public readonly world: IWorld) {}
}

/**
 * Updates the current participant.
 */
export class UpdateParticipants implements Action {
  public readonly type = SchemaActionTypes.UPDATE_PARTICIPANT;

  constructor(public readonly participant: IParticipant) {}
}

/**
 * Updates the current groups.
 */
export class UpdateGroups implements Action {
  public readonly type = SchemaActionTypes.UPDATE_GROUPS;

  constructor(public readonly groups: IGroup[]) {}
}

/**
 * Saves or overwrites a world snapshot.
 */
export class SaveSnapshot implements Action {
  public readonly type = SchemaActionTypes.SAVE_SNAPSHOT;

  constructor(public readonly name: string, public readonly world: IWorld) {}
}

/**
 * Deletes a world snapshot.
 */
export class DeleteSnapshot implements Action {
  public readonly type = SchemaActionTypes.DELETE_SNAPSHOT;

  constructor(public readonly name: string) {}
}

/**
 * Requests to load a snapshot from the server.
 */
export class LoadSnapshot implements Action {
  public readonly type = SchemaActionTypes.LOAD_SNAPSHOT;

  constructor(public readonly snapshot: ISnapshot) {}
}

/**
 * Fired when a snapshot has been persisted to the server.
 */
export class SnapshotCreated implements Action {
  public readonly type = SchemaActionTypes.SNAPSHOT_CREATED;

  constructor(public readonly snapshots: ISnapshot[]) {}
}

/**
 * Fired when we want to copy a world schema from a linked game.
 */
export class CopyWorldSchema implements Action {
  public readonly type = SchemaActionTypes.COPY_WORLD_FROM_GAME;

  constructor(public readonly game: IInteractiveGame) {}
}

/**
 * Fired when we want to upload the world schema to a game from the UI.
 * The effect handles display of content internally.
 */
export class QuickUploadWorldSchema implements Action {
  public readonly type = SchemaActionTypes.QUICK_UPLOAD_WORLD;

  constructor(public readonly game: IInteractiveGame) {}
}

/**
 * Fired when we want to upload the world schema to a game.
 */
export class UploadWorldSchema implements Action {
  public readonly type = SchemaActionTypes.UPLOAD_WORLD_TO_GAME;

  constructor(public readonly game: IInteractiveGame) {}
}

/**
 * Fired when the world upload completes
 */
export class UploadWorldComplete implements Action {
  public readonly type = SchemaActionTypes.UPLOAD_WORLD_COMPLETE;
}

/**
 * Fired when the world upload fails
 */
export class UploadWorldFailed implements Action {
  public readonly type = SchemaActionTypes.UPLOAD_WORLD_FAILED;

  constructor(public readonly error: RpcError) {}
}

export type SchemaActions =
  | UpdateParticipants
  | UpdateWorldSchema
  | UpdateGroups
  | SaveSnapshot
  | LoadSnapshot
  | SnapshotCreated
  | DeleteSnapshot
  | CopyWorldSchema
  | UploadWorldSchema
  | UploadWorldComplete
  | UploadWorldFailed;
