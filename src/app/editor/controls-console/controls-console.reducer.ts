import { createFeatureSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import {
  ControlsConsoleActions,
  ControlsConsoleActionTypes,
  IFilter,
  IMessageEntry,
  noopFilter,
} from './controls-console.actions';
import { IMessage } from './messages/message';

export interface IControlsConsoleState {
  messages: IMessageEntry[];
  lastReadAt: number;
  filter: IFilter;
  expandedMessage: string | null;
}

export interface IState extends fromRoot.IState {
  controlsConsole: IControlsConsoleState;
}

const maxMessages = 500;

const initialState: IControlsConsoleState = {
  messages: [],
  lastReadAt: 0,
  filter: noopFilter,
  expandedMessage: null,
};

export function controlsConsoleReducer(
  state: IControlsConsoleState = initialState,
  action: ControlsConsoleActions,
): IControlsConsoleState {
  switch (action.type) {
    case ControlsConsoleActionTypes.AppendMessage: {
      const messages = state.messages.slice(-maxMessages + 1);
      messages.push({ message: action.message, hasSeen: false, createdAt: Date.now() });
      return { ...state, messages };
    }
    case ControlsConsoleActionTypes.Clear:
      return { ...state, messages: [], expandedMessage: null };
    case ControlsConsoleActionTypes.MarkRead: {
      const messages = state.messages.slice();
      for (let i = messages.length - 1; i >= 0 && !messages[i].hasSeen; i--) {
        messages[i] = { ...messages[i], hasSeen: true };
      }
      return { ...state, lastReadAt: Date.now(), messages };
    }
    case ControlsConsoleActionTypes.SetFilter:
      return { ...state, filter: action.filter, expandedMessage: null };
    case ControlsConsoleActionTypes.SetExpandedMessage:
      return { ...state, expandedMessage: action.messageId };
    default:
      return state;
  }
}

/**
 * Selector for the controls console feature.
 */
export const consoleData = createFeatureSelector<IControlsConsoleState>('controlsConsole');

/**
 * Selector for the console messages.
 */
export const selectMessages = createSelector(consoleData, s => s.messages);

/**
 * Selector for the applied console filter.
 */
export const selectFilter = createSelector(consoleData, s => s.filter);

/**
 * Selector for the last read time.
 */
export const selectReadAt = createSelector(consoleData, s => s.lastReadAt);

/**
 * Selector for the expanded message.
 */
export const selectExpanded = createSelector(consoleData, s => s.expandedMessage);

/**
 * Tries to return the given message's paired friend. A method call if the
 * message is a reply, a method response if it's a call.
 */
export function getPair(message: IMessage, messages: IMessageEntry[]) {
  if (message.inReplyTo) {
    return messages.find(m => m.message.id === message.inReplyTo);
  } else {
    return messages.find(m => m.message.inReplyTo === message.id);
  }
}
