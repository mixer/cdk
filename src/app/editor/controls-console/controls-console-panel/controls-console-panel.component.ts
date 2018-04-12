import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as JSON5 from 'json5';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { SendControlPacket } from '../../controls/controls.actions';
import { truthy } from '../../shared/operators';
import {
  Clear,
  IFilter,
  IMessageEntry,
  SetExpandedMessage,
  SetFilter,
} from '../controls-console.actions';
import * as fromConsole from '../controls-console.reducer';
import { selectExpanded } from '../controls-console.reducer';
import { ControlsRemoteConsoleService } from '../controls-remote-console.service';
import { IMessage, Message } from '../messages/message';

/**
 * Number of pixels of upwards scroll after which we'll no longer
 * automatically scroll down when new messages come in.
 */
const scrollThreshold = 32;

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'controls-console-panel',
  templateUrl: './controls-console-panel.component.html',
  styleUrls: ['./controls-console-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsControlsPanelComponent implements AfterContentInit {
  /**
   * Filter currently in use in the console display.
   */
  public readonly filter: Observable<IFilter> = this.store.select(fromConsole.selectFilter);

  /**
   * An observable of console messages to display.
   */
  public readonly messages: Observable<IMessageEntry[]> = this.filter.pipe(
    switchMap(messageFilter => this.console.filter(messageFilter)),
    tap(() => this.rescroll()),
  );

  /**
   * Returns the number of messages omitted by the filter.
   */
  public readonly omitted: Observable<number> = this.filter.pipe(
    switchMap(messageFilter => this.console.countOmitted(messageFilter)),
  );

  /**
   * Template hoist for the Message enum.
   */
  public Message = Message;

  /**
   * An observable that contains the ID of the message that the user has
   * expanded, if any.
   */
  public expandedId = this.store.select(selectExpanded);

  /**
   * The ID of the message that's a pair to the one currently being hovered.
   */
  public hoveredPair = new BehaviorSubject<string | null>(null);

  /**
   * repl input to be sent to the controls.
   */
  public commandInput = new BehaviorSubject('');

  /**
   * Whether to show the search filter.
   */
  public showFilter = new BehaviorSubject(false);

  /**
   * Reference to the container containing the console messages.
   */
  @ViewChild('container') public readonly container: ElementRef;

  /**
   * Reference to the filter input text field.
   */
  @ViewChild('filterInput') public readonly filterInput: ElementRef;

  constructor(
    public readonly console: ControlsRemoteConsoleService,
    private readonly snackRef: MatSnackBar,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  public ngAfterContentInit() {
    const el: HTMLElement = this.container.nativeElement;
    el.scrollTop = el.scrollHeight;

    const filterInput: HTMLElement = this.filterInput.nativeElement;
    filterInput.addEventListener('keydown', ev => {
      switch (ev.keyCode) {
        case 13: // enter
          this.showFilter.next(false);
          break;
        case 27: // escape
          this.setPattern('');
          this.showFilter.next(false);
          break;
        default:
          return;
      }

      ev.preventDefault();
    });
  }

  /**
   * Updates the filter pattern for the console.
   */
  public setPattern(pattern: string) {
    this.filter.pipe(take(1)).subscribe(messageFilter => {
      this.store.dispatch(new SetFilter({ ...messageFilter, pattern }));
    });
  }

  /**
   * Toggles whether one kind of message is show in the console, or not.
   */
  public toggleFilterKind(kind: Message) {
    this.filter.pipe(take(1)).subscribe(existing => {
      this.store.dispatch(
        new SetFilter({
          ...existing,
          kinds: {
            ...existing.kinds,
            [kind]: existing.kinds ? (<any>existing.kinds)[kind] === false : false,
          },
        }),
      );
    });
  }

  /**
   * Returns whether the filter of the given kind is turned on.
   */
  public hasFilterKind(kind: Message): Observable<boolean> {
    return this.filter.pipe(map(f => !f.kinds || (<any>f.kinds)[kind] !== false));
  }

  /**
   * Called when the user clicks on a message. If they click on a message
   * that's already expanded, it's closed, otherwise it toggles to that one.
   */
  public toggleExpansion(messageId: string) {
    if (!window.getSelection().isCollapsed) {
      return; // noop if they're selecting text
    }

    this.expandedId.pipe(take(1)).subscribe(expandedId => {
      if (messageId === expandedId) {
        this.store.dispatch(new SetExpandedMessage(null));
      } else {
        this.store.dispatch(new SetExpandedMessage(messageId));
      }
    });
  }

  /**
   * Called when the mouse hovers over a message. We'll try to find the
   * appropriate response/reply and show it as hovered, too.
   */
  public hoveredMessage(message: IMessage) {
    this.console
      .getPairMessage(message)
      .pipe(take(1), truthy())
      .subscribe(pair => this.hoveredPair.next(pair.message.id));
  }

  /**
   * Called when the user wants to send a command to the frame.
   */
  public sendCommand() {
    const data = this.commandInput.getValue().trim();
    const paren = data.indexOf('(');
    if (paren === -1 || !data.endsWith(')')) {
      this.showCommandError(
        'Your command should be in the format "method({ arguments: \'here\' })"',
      );
      return;
    }

    const method = data.slice(0, paren);
    const innerJSON = data.slice(paren + 1, -1);
    let params: any;
    try {
      params = innerJSON ? JSON5.parse(innerJSON) : null;
    } catch (e) {
      this.showCommandError(`Could not parse your command arguments: ${e}`);
      return;
    }

    this.store.dispatch(new SendControlPacket(method, params));
    this.commandInput.next('');
  }

  /**
   * Clears the console.
   */
  public clear() {
    this.store.dispatch(new Clear());
  }

  /**
   * Opens a toast with the provided error message.
   */
  private showCommandError(message: string) {
    this.snackRef.open(message, undefined, { duration: 5000 });
  }

  /**
   * Scrolls the console to the bottom of the screen, if it's near it.
   */
  private rescroll() {
    this.expandedId.pipe(take(1), filter(e => !e)).subscribe(() => {
      const el: HTMLElement = this.container.nativeElement;
      if (el.scrollTop + el.clientHeight > el.scrollHeight - scrollThreshold) {
        setTimeout(() => (el.scrollTop = el.scrollHeight));
      }
    });
  }
}
