import { IGroup } from '@mixer/cdk-std/dist/internal';
import { Selector } from '@ngrx/store';

import { selectGroups } from '../schema.reducer';
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
  public getSelector(): Selector<object, IGroup[]> {
    return selectGroups;
  }

  /**
   * @override
   */
  public compare(previous: IGroup[], next: IGroup[]): ICall[] {
    return this.updater.compare(previous, next);
  }

  /**
   * @override
   */
  protected createPacket(source: IGroup[]): ICall[] {
    return [
      {
        method: 'onGroupCreate',
        params: { groups: source },
      },
    ];
  }
}
