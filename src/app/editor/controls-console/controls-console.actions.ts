import { Action } from '@ngrx/store';
import { IMessage, Message } from './messages/message';

export const enum ControlsConsoleActionTypes {
  AppendMessage = '[ControlsConsole] Append message',
  MarkRead = '[ControlsConsole] Mark read',
  Clear = '[ControlsConsole] Clear',
  SetFilter = '[ControlsConsole] Set Filter',
  SetExpandedMessage = '[ControlsConsole] Set expanded message',
}

/**
 * IFilter can be passed to the ConsoleService to configure which messages
 * are displayed.
 */
export interface IFilter {
  /**
   * Map of message kinds, setting one to `false` will hide it.
   */
  kinds?: { [key in keyof typeof Message]?: boolean };

  /**
   * Pattern to match against in the message text. Can be wrapped in slashes
   * to denote a regex.
   */
  pattern?: string;

  /**
   * If true, only return unread messages.
   */
  onlyUnread?: boolean;
}

export interface IMessageEntry {
  /**
   * The source message.
   */
  message: IMessage;
  /**
   * The time when the message was posted.
   */
  createdAt: number;
  /**
   * Whether the user has seen this message yet (reset with `markRead()`)
   */
  hasSeen: boolean;
}

/**
 * Filter that lets everything through.
 */
export const noopFilter: IFilter = {};

/**
 * Clears the console console.
 */
export class Clear implements Action {
  public readonly type = ControlsConsoleActionTypes.Clear;
}

/**
 * Marks the console as having been read.
 */
export class MarkRead implements Action {
  public readonly type = ControlsConsoleActionTypes.MarkRead;
}

/**
 * Applies a filter to the console.
 */
export class SetFilter implements Action {
  public readonly type = ControlsConsoleActionTypes.SetFilter;

  constructor(public readonly filter: IFilter) {}
}

/**
 * Appends a message to the console.
 */
export class AppendMessage implements Action {
  public readonly type = ControlsConsoleActionTypes.AppendMessage;

  constructor(public readonly message: IMessage) {}
}

/**
 * Sets which message is shown as expanded in the console.
 */
export class SetExpandedMessage implements Action {
  public readonly type = ControlsConsoleActionTypes.SetExpandedMessage;

  constructor(public readonly messageId: string | null) {}
}

export type ControlsConsoleActions =
  | AppendMessage
  | SetFilter
  | Clear
  | MarkRead
  | SetExpandedMessage;
