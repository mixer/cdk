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
import { untilDestroyed } from '../../shared/untilDestroyed';
import { baseTheme } from './themes';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'console-display',
  template: '<div class="console"></div>',
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

  constructor(private readonly el: ElementRef) {}

  public ngAfterContentInit() {
    const container: HTMLElement = this.el.nativeElement;
    const terminal = new Terminal({
      theme: { ...baseTheme, ...this.theme },
      fontSize: 13,
      lineHeight: 1.2,
    });

    terminal.open(<HTMLElement>container.querySelector('.console'));
    this.data
      .pipe(untilDestroyed(this))
      .subscribe(data => terminal.write(data.replace(/\r?\n/g, '\r\n')));
    this.terminal = terminal;
  }

  public ngOnDestroy() {
    this.terminal.destroy();
  }
}
