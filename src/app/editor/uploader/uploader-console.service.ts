import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map, merge } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

/**
 * Service that holds state about what's in the webpack console output.
 */
@Injectable()
export class UploaderConsoleService {
  /**
   * Maximum number of console output lines to store.
   */
  public static lineLimit = 10000;

  /**
   * A subject that emits with any new lines, as they're added.
   */
  private readonly newLines = new Subject<string>();

  private lines: string[] = [];

  /**
   * Inserts a new line into the console.
   */
  public write(line: string) {
    this.lines.push(line);
    this.newLines.next(line);
  }

  /**
   * Returns an observable of the console contents.
   */
  public contents(): Observable<string> {
    return of(this.lines.join('')).pipe(merge(this.newLines), map(l => l));
  }

  /**
   * Clears lines from the console.
   */
  public clear() {
    this.lines = [];
  }
}
