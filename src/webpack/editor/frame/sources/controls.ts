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
      data: { scenes },
    }),
    update: scenes => ({
      method: 'onSceneUpdate',
      data: { scenes },
    }),
    destroy: sceneID => ({
      method: 'onSceneDelete',
      data: { sceneID, reassignSceneID: 'default' },
    }),
    nested: {
      controls: {
        id: 'controlID',
        create: (controls, scene: IScene) => ({
          method: 'onControlCreate',
          data: { controls, sceneID: scene.sceneID },
        }),
        update: (controls, scene: IScene) => ({
          method: 'onControlUpdate',
          data: { controls, sceneID: scene.sceneID },
        }),
        destroy: (controlID, scene: IScene) => ({
          method: 'onControlDelete',
          data: {
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
    return 'controls';
  }

  /**
   * @override
   */
  protected createPacket(source: IScene[]): ICall {
    return {
      method: 'onSceneCreate',
      data: { scenes: source },
    };
  }
}
