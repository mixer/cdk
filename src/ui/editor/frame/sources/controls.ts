import { IScene } from '@mcph/miix-std/dist/internal';
import { isEqual } from 'lodash';

import { ICodeState } from '../../redux/code';
import { ICall, ResourceComparator, Source } from './source';

export interface IScenesData {
  scenes: IScene[];
}

/**
 * ControlsSource is a Source for the Interactive scene/controls.
 */
export class ControlsSource extends Source<IScenesData | IScene[]> {
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
  public compare(previous: IScenesData | IScene[], next: IScenesData | IScene[]): ICall[] {
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
  protected sourceProp(): keyof ICodeState {
    return 'scenes';
  }

  /**
   * @override
   */
  protected createPacket(source: IScenesData): ICall[] {
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
