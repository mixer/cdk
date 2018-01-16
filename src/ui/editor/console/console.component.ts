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

import { IProject, ProjectService } from '../redux/project';
import { ConsoleService, IFilter, IMessageEntry } from './console.service';
import { IMessage, Message } from './messages/message';

/**
 * Number of pixels of upwards scroll after which we'll no longer
 * automatically scroll down when new messages come in.
 */
const scrollThreshold = 32;

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleComponent implements AfterContentInit {
  /**
   * Filter currently in use in the console display.
   */
  public readonly filter: Observable<IFilter> = this.store.map(state => state.console.filter);

  /**
   * An observable of console messages to display.
   */
  public readonly messages: Observable<IMessageEntry[]> = this.filter
    .switchMap(filter => this.console.read(filter))
    .do(() => {
      this.rescroll();
    });

  /**
   * Returns the number of messages omitted by the filter.
   */
  public readonly omitted: Observable<number> = this.filter.switchMap(filter =>
    this.console.omitted(filter),
  );

  /**
   * Template hoist for the Message enum.
   */
  public Message = Message;

  /**
   * An observable that contains the ID of the message that the user has
   * expanded, if any.
   */
  public expandedId = new BehaviorSubject<string | null>(null);

  /**
   * The ID of the message that's a pair to the one currently being hovered.
   */
  public hoveredPair = new BehaviorSubject<string | null>(null);

  /**
   * repl input to be sent to the controls.
   */
  public commandInput = new BehaviorSubject('');

  /**
   * Reference to the container containing the console messages.
   */
  @ViewChild('container') public readonly container: ElementRef;

  constructor(
    public readonly console: ConsoleService,
    private readonly snackRef: MatSnackBar,
    private readonly store: Store<IProject>,
    private readonly project: ProjectService,
  ) {}

  public ngAfterContentInit() {
    const el: HTMLElement = this.container.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  /**
   * Updates the filter pattern for the console.
   */
  public setPattern(pattern: string) {
    this.filter.take(1).subscribe(filter => {
      this.project.setConsoleFilter({ ...filter, pattern });
    });
  }

  /**
   * Toggles whether one kind of message is show in the console, or not.
   */
  public toggleFilterKind(kind: Message) {
    this.filter.take(1).subscribe(existing => {
      this.project.setConsoleFilter({
        ...existing,
        kinds: {
          ...existing.kinds,
          [kind]: (<any>existing.kinds)[kind] === false,
        },
      });
    });
  }

  /**
   * Returns whether the filter of the given kind is turned on.
   */
  public hasFilterKind(kind: Message): Observable<boolean> {
    return this.filter.map(f => (<any>f.kinds)[kind] !== false);
  }

  /**
   * Called when the user clicks on a message. If they click on a message
   * that's already expanded, it's closed, otherwise it toggles to that one.
   */
  public toggleExpansion(messageId: string) {
    if (!window.getSelection().isCollapsed) {
      return; // noop if they're selecting text
    }
    if (messageId === this.expandedId.getValue()) {
      this.expandedId.next(null);
    } else {
      this.expandedId.next(messageId);
    }
  }

  /**
   * Called when the mouse hovers over a message. We'll try to find the
   * appropriate response/reply and show it as hovered, too.
   */
  public hoveredMessage(message: IMessage) {
    const pair = this.console.getPairMessage(message);
    if (pair) {
      this.hoveredPair.next(pair.message.id);
    }
  }

  /**
   * Called when the user wants to send a command to the frame.
   */
  public sendCommand() {
    const data = this.commandInput.getValue().trim();
    const paren = data.indexOf('(');
    if (paren === -1 || !data.endsWith(')')) {
      this.showCommandError('Your command should be in the format "method({ arguments: "here" })"');
      return;
    }

    const name = data.slice(0, paren);
    const innerJSON = data.slice(paren + 1, -1);
    let params: any;
    try {
      params = innerJSON ? JSON5.parse(innerJSON) : null;
    } catch (e) {
      this.showCommandError(`Could not parse your command arguments: ${e}`);
      return;
    }

    this.console.run(name, params);
    this.commandInput.next('');
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
    if (this.expandedId.getValue() !== null) {
      return;
    }

    const el: HTMLElement = this.container.nativeElement;
    if (el.scrollTop + el.clientHeight > el.scrollHeight - scrollThreshold) {
      setTimeout(() => (el.scrollTop = el.scrollHeight));
    }
  }
}
