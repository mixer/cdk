import { IParticipant } from '../../../../stdlib/typings';
import { ICodeState } from '../../redux/code';
import { ICall, Source } from './source';

/**
 * Participant is a Source for the participant themselves.
 */
export class ParticipantSource extends Source<IParticipant> {
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
  protected sourceProp(): keyof ICodeState {
    return 'participant';
  }

  /**
   * @override
   */
  protected createPacket(source: IParticipant): ICall {
    return {
      method: 'onParticipantJoin',
      params: { participants: [source] },
    };
  }
}
