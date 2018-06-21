import { IParticipant } from '@mixer/cdk-std/dist/internal';
import { Selector } from '@ngrx/store';

import { selectParticipant } from '../schema.reducer';
import { ICall, Source } from './source';

/**
 * Participant is a Source for the participant themselves.
 */
export class ParticipantSource extends Source<IParticipant> {
  /**
   * @override
   */
  public getSelector(): Selector<object, IParticipant> {
    return selectParticipant;
  }

  /**
   * @override
   */
  public compare(_previous: IParticipant, next: IParticipant): ICall[] {
    return [
      {
        method: 'onParticipantUpdate',
        params: { participants: [next] },
      },
    ];
  }

  /**
   * @override
   */
  protected createPacket(source: IParticipant): ICall[] {
    return [
      {
        method: 'onParticipantJoin',
        params: { participants: [source] },
      },
    ];
  }
}
