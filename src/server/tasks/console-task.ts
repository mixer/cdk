import { ChildProcess } from 'child_process';
import { Observable } from 'rxjs/Observable';
import { merge } from 'rxjs/observable/merge';
import { filter, map } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import * as treekill from 'tree-kill';

import { promiseCallback } from '../util';
import { Task, TaskState } from './task';

/**
 * The SimpleConsoleTask is a Task with functionality for managing
 * i/o and lifetimes of a single subprocess.
 */
export abstract class ConsoleTask<T> extends Task<T> {
  protected childProcess: ChildProcess | void;

  public async start(): Promise<T> {
    const [retVal, subprocess] = await this.spawnChildProcess();
    this.childProcess = subprocess;

    merge(fromInputSlices(subprocess.stdout, '\n'), fromInputSlices(subprocess.stderr, '\n'))
      .pipe(
        map(line => this.processLine(line)),
        filter(line => line !== undefined),
        map(line => `${line}\n`),
      )
      .subscribe(line => this.data.next(line!));

    subprocess.on('exit', () => this.setTaskState(TaskState.Stopped));

    return retVal;
  }

  /**
   * @override
   */
  public async onStopped(): Promise<void> {
    if (!this.childProcess) {
      return;
    }

    // process.kill() is not sufficient on windows,
    // see https://stackoverflow.com/a/32814686/1125956
    const pid = this.childProcess.pid;
    this.beforeStop();
    await promiseCallback(cb => treekill(pid, 'SIGINT', cb));
    this.childProcess = undefined;
  }

  /**
   * Called once when stop() is called, before killing the subprocess.
   */
  protected beforeStop(): void {
    return undefined;
  }

  /**
   * Called when a line of output is read from the console. Should return the
   * line, or void if the line should be omitted.
   */
  protected processLine(line: string): string | void {
    return line;
  }

  /**
   * Creates the subprocess and gives the appropriate return value for the
   * initiation of this class.
   */
  protected abstract spawnChildProcess(): Promise<[T, ChildProcess]>;
}

/**
 * Returns an observable of the input data sliced into happy little
 * delimiter-delimited chunks.
 */
function fromInputSlices(stream: NodeJS.ReadableStream, delimiter: string): Observable<string> {
  const subj = new Subject<string>();
  let buffer = Buffer.from([]);

  stream.on('data', data => {
    buffer = Buffer.concat([buffer, data]);

    // tslint:disable-next-line
    while (true) {
      const index = buffer.indexOf(delimiter);
      if (index === -1) {
        return;
      }

      subj.next(buffer.slice(0, index).toString());
      buffer = buffer.slice(index + delimiter.length);
    }
  });

  return subj;
}
