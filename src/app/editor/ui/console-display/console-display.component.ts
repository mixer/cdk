import { Actions } from '@ngrx/effects';
import { debounceTime } from 'rxjs/operators';
import { ITheme, Terminal } from 'xterm';

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { LayoutActionTypes } from '../../layout/layout.actions';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { baseTheme } from './themes';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'console-display',
  template: '',
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
   * Terminal instance currently displayed.
   */
  private terminal: Terminal;

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
    terminal.open(container);
  }

  public resizeConsole() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.terminal.setOption('rows', this.calculateRows(rect));
    this.terminal.setOption('cols', this.calculateColumns(rect));
  }

  public ngOnDestroy() {
    this.terminal.destroy();
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
