import { IGroup } from '../../../../stdlib/typings';
import { ICodeState } from '../../redux/code';
import { ICall, ResourceComparator, Source } from './source';

/**
 * GroupSource is a source for the participant groups.
 */
export class GroupSource extends Source<IGroup[]> {
  private updater = new ResourceComparator<IGroup>({
    id: 'groupID',
    create: groups => ({
      method: 'onGroupCreate',
      data: { groups },
    }),
    update: groups => ({
      method: 'onGroupUpdate',
      data: { groups },
    }),
    destroy: groupID => ({
      method: 'onGroupDelete',
      data: { groupID, reassignGroupID: 'default' },
    }),
  });

  /**
   * @override
   */
  public compare(previous: IGroup[], next: IGroup[]): ICall[] {
    return this.updater.compare(previous, next);
  }

  /**
   * @override
   */
  protected sourceProp(): keyof ICodeState {
    return 'groups';
  }

  /**
   * @override
   */
  protected createPacket(source: IGroup[]): ICall {
    return {
      method: 'onGroupCreate',
      data: { groups: source },
    };
  }
}
