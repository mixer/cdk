import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IMessageEntry } from '../controls-console.actions';
import { ControlsRemoteConsoleService } from '../controls-remote-console.service';
import { Message } from '../messages/message';

/**
 * The expanded message is shown when a user clicks on a logged message.
 * It pretty-prints the message content and shows the reply or response
 * associated with this one.
 */
@Component({
  selector: 'editor-expanded-message',
  templateUrl: './expanded-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedMessageComponent implements OnChanges {
  /**
   * Message displayed in this component.
   */
  @Input() public item: IMessageEntry;

  /**
   * Whether this item was sent to the controls (true) or received from them (false).
   */
  public wasSent: boolean;

  /**
   * The corresponding request/reply pair, if available.
   */
  public pair: Observable<IMessageEntry | undefined>;

  /**
   * Whether the pair message is a reply
   */
  public isReply: boolean;

  constructor(private readonly console: ControlsRemoteConsoleService) {}

  public ngOnChanges() {
    const { message } = this.item;
    this.wasSent = [Message.SentMethod, Message.SentReply].includes(message.kind);
    this.pair = this.console.getPairMessage(message);
    this.isReply = Boolean(message.inReplyTo);
  }
}
