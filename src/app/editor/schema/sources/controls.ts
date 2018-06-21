import { IScene } from '@mixer/cdk-std/dist/internal';
import { Selector } from '@ngrx/store';
import { isEqual } from 'lodash';

import { IWorld } from '../schema.actions';
import { selectWorld } from '../schema.reducer';
import { ICall, ResourceComparator, Source } from './source';

/**
 * ControlsSource is a Source for the Interactive scene/controls.
 */
export class ControlsSource extends Source<IWorld | IScene[]> {
  private updater = new ResourceComparator<IScene>({
    id: 'sceneID',
    create: scenes => ({
      method: 'onSceneCreate',
      params: { scenes },
    }),
    update: scenes => ({
      method: 'onSceneUpdate',
      params: { scenes },
    }),
    destroy: sceneID => ({
      method: 'onSceneDelete',
      params: { sceneID, reassignSceneID: 'default' },
    }),
    nested: {
      controls: {
        id: 'controlID',
        create: (controls, scene: IScene) => ({
          method: 'onControlCreate',
          params: { controls, sceneID: scene.sceneID },
        }),
        update: (controls, scene: IScene) => ({
          method: 'onControlUpdate',
          params: { controls, sceneID: scene.sceneID },
        }),
        destroy: (controlID, scene: IScene) => ({
          method: 'onControlDelete',
          params: {
            sceneID: scene.sceneID,
            controls: [{ controlID }],
          },
        }),
      },
    },
  });

  /**
   * @override
   */
  public getSelector(): Selector<object, IWorld> {
    return selectWorld;
  }

  /**
   * @override
   */
  public compare(previous: IWorld | IScene[], next: IWorld | IScene[]): ICall[] {
    if (Array.isArray(previous)) {
      previous = { scenes: previous };
    }
    if (Array.isArray(next)) {
      next = { scenes: next };
    }

    const sceneUpdates = this.updater.compare(previous.scenes, next.scenes);

    const prevWithoutScenes = { ...previous, scenes: null };
    const nextWithoutScenes = { ...next, scenes: null };
    if (!isEqual(nextWithoutScenes, prevWithoutScenes)) {
      sceneUpdates.push({
        method: 'onWorldUpdate',
        params: next,
      });
    }

    return sceneUpdates;
  }

  /**
   * @override
   */
  protected createPacket(source: IWorld): ICall[] {
    if (Array.isArray(source)) {
      source = { scenes: source };
    }

    return [
      {
        method: 'onSceneCreate',
        params: { scenes: source.scenes },
      },
      {
        method: 'onWorldUpdate',
        params: { ...source, scenes: undefined },
      },
    ];
  }
}
