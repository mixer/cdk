import { IGroup, IParticipant, IScene } from '@mcph/miix-std/dist/internal';
import { Action } from '@ngrx/store';

export const enum SchemaActionTypes {
  UPDATE_WORLD_SCHEMA = '[Schema] Update World Schema',
  UPDATE_PARTICIPANT = '[Schema] Update Participant',
  UPDATE_GROUPS = '[Schema] Update Groups',
}

export interface IWorld {
  scenes: IScene[];
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

export const initialControls = [
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
        ],
      },
    ],
  },
];

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

export type SchemaActions = UpdateParticipants | UpdateWorldSchema | UpdateGroups;
