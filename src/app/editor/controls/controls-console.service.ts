import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map, merge } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

const crlf = '\r\n';

/**
 * Service that holds state about what's in the webpack console output.
 */
@Injectable()
export class ControlsConsoleService {
  /**
   * Maximum number of console output lines to store.
   */
  public static lineLimit = 10000;

  /**
   * A subject that emits with any new lines, as they're added.
   */
  private readonly newLines = new Subject<string>();

  private lines: string[] = [];
  private lastLineWasCompleted = true;

  /**
   * Inserts a new line into the console.
   */
  public write(data: string) {
    const lines = data.split(/\r?\n/g);
    const completed = data.endsWith('\n');

    // If the last line we received wasn't finished, add the first line we
    // have onto it. If that line is then finished, emit it.
    if (!this.lastLineWasCompleted) {
      this.lines[this.lines.length - 1] += lines.shift();
      if (completed || lines.length > 0) {
        this.newLines.next(this.lines[this.lines.length - 1]);
      }
    }

    // Add all new lines in and emit all of them, except the last one if
    // the last one isn't compelted.
    this.lastLineWasCompleted = completed;
    lines.forEach((line, i) => {
      if (!completed && i === lines.length - 1) {
        return;
      }

      this.lines.push(line);
      this.newLines.next(line);
    });

    // Trim any excess.
    if (this.lines.length > ControlsConsoleService.lineLimit) {
      this.lines = this.lines.slice(-Math.round(ControlsConsoleService.lineLimit * 2 / 3));
    }
  }

  /**
   * Returns an observable of the console contents.
   */
  public contents(): Observable<string> {
    return of(this.lines.join(crlf)).pipe(merge(this.newLines), map(l => l + crlf));
  }
}
