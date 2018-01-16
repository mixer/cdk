import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

import { ConsoleService, IMessageEntry } from './console.service';
import { Message } from './messages/message';

/**
 * The host component holds the arrangement of macroscopic editor components.
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
  public pair: IMessageEntry | undefined;

  /**
   * Whether the pair message is a reply
   */
  public isReply: boolean;

  constructor(private readonly console: ConsoleService) {}

  public ngOnChanges() {
    const { message } = this.item;
    this.wasSent = [Message.SentMethod, Message.SentReply].includes(message.kind);
    this.pair = this.console.getPairMessage(message);
    this.isReply = Boolean(message.inReplyTo);
  }
}
