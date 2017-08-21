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
      params: { groups },
    }),
    update: groups => ({
      method: 'onGroupUpdate',
      params: { groups },
    }),
    destroy: groupID => ({
      method: 'onGroupDelete',
      params: { groupID, reassignGroupID: 'default' },
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
      params: { groups: source },
    };
  }
}
