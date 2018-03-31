import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { debounceTime } from 'rxjs/operators';
import { ITheme, Terminal } from 'xterm';

import { LayoutActionTypes } from '../../layout/layout.actions';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { baseTheme } from './themes';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'console-display',
  template: '<div #target></div>',
  styleUrls: ['./console-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleDisplayComponent implements AfterContentInit, OnDestroy {
  /**
   * An observable feed of data to read and display in the console.
   */
  @Input() public data: Observable<string>;

  /**
   * Optional theme overrides.
   */
  @Input() public theme: Partial<ITheme>;

  /**
   * Element to mount the terminal in.
   */
  @ViewChild('target') public target: ElementRef;

  /**
   * Terminal instance currently displayed.
   */
  public terminal: Terminal;

  constructor(private readonly el: ElementRef, private readonly actions: Actions) {}

  public ngAfterContentInit() {
    const container: HTMLElement = this.el.nativeElement;
    const rect = container.getBoundingClientRect();
    const terminal = new Terminal({
      theme: { ...baseTheme, ...this.theme },
      fontSize: 13,
      fontFamily: 'Source Code Pro',
      lineHeight: 1.2,
      rows: this.calculateRows(rect),
      cols: this.calculateColumns(rect),
    });

    this.data
      .pipe(untilDestroyed(this))
      .subscribe(data => terminal.write(data.replace(/\r?\n/g, '\r\n')));

    this.actions
      .ofType(LayoutActionTypes.PANELS_SAVE)
      .pipe(untilDestroyed(this), debounceTime(2))
      .subscribe(() => this.resizeConsole());

    this.terminal = terminal;
    terminal.open(this.target.nativeElement);
  }

  public ngOnDestroy() {
    this.terminal.destroy();
  }

  /**
   * Trigged when the screen size changes.
   */
  private resizeConsole() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.terminal.resize(this.calculateColumns(rect), this.calculateRows(rect));
  }

  /**
   * Yea, this has to be done manually sadly, no option for "fill container".
   * Event VSCode does it manually: https://git.io/vxu3B. 20.8695 is
   * the computed height for our font.
   */
  private calculateRows(rect: ClientRect = this.el.nativeElement.getBoundingClientRect()) {
    return Math.max(Math.floor(rect.height / 20.8695), 5);
  }

  private calculateColumns(rect: ClientRect = this.el.nativeElement.getBoundingClientRect()) {
    return Math.max(Math.floor(rect.width / 8.75), 40);
  }
}
