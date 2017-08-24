import { IScene } from '../../../../stdlib/typings';
import { ICodeState } from '../../redux/code';
import { ICall, ResourceComparator, Source } from './source';

/**
 * ControlsSource is a Source for the Interactive scene/controls.
 */
export class ControlsSource extends Source<IScene[]> {
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
  public compare(previous: IScene[], next: IScene[]): ICall[] {
    return this.updater.compare(previous, next);
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
  protected createPacket(source: IScene[]): ICall {
    return {
      method: 'onSceneCreate',
      params: { scenes: source },
    };
  }
}
