import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

/**
 * State for Task instances. Progression is linear.
 */
export const enum TaskState {
  Running,
  Stopped,
}

/**
 * Simple registry of currently running tasks.
 */
export class TaskList {
  private tasks = new Map<number, Task<any>>();

  constructor() {
    process.on('exit', async () => this.stopAll());
  }

  /**
   * Tracks a task in the target list.
   */
  public add(task: Task<any>) {
    this.tasks.set(task.id, task);
    task.taskState
      .pipe(filter(s => s === TaskState.Stopped), take(1))
      .subscribe(() => this.tasks.delete(task.id));
  }

  /**
   * Stops all running webpack dev servers.
   */
  public async stopAll(predicate: (t: Task<any>) => boolean = () => true): Promise<void> {
    const todo: Promise<void>[] = [];
    for (const task of this.tasks.values()) {
      if (predicate(task)) {
        todo.push(task.stop());
      }
    }

    await Promise.all(todo);
  }

  /**
   * Returns a list of all running webpack dev servers.
   */
  public getAll(): Task<any>[] {
    return [...this.tasks.values()];
  }

  /**
   * Stops a task by its ID, if it exists. Returns whether a task was stopped.
   */
  public async stop(id: number): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    await task.stop();
    return true;
  }
}

/**
 * The Task is a runnable and haltable unit of code. It's essentially a fancy
 * promise with cancellation and hooks into the TaskList so that the tree
 * can be taken care of as the application closes (necessary on Windows to
 * avoid leaking processes).
 */
export abstract class Task<T> {
  private static idIncrement = 0;

  /**
   * Unique ID of this task instance.
   */
  public readonly id = Task.idIncrement++;

  /**
   * Current state of the task.
   */
  public readonly taskState = new BehaviorSubject(TaskState.Running);

  /**
   * Observable of data output from the task.
   */
  public readonly data = new Subject<string>();

  /**
   * Returns a promise that resolves once the task is stopped.
   */
  public get untilStopped() {
    return this.taskState.pipe(filter(s => s === TaskState.Stopped), take(1)).toPromise();
  }

  /**
   * A list of nested running tasks.
   */
  private subtasks = new TaskList();

  /**
   * Starts the task.
   */
  public abstract start(): Promise<T>;

  /**
   * Stops the ongoing task, returns a promise that resolves once it's
   * been torn down. Will be called if the task is manually stopped, or
   * before the process exits.
   */
  public async stop(): Promise<void> {
    if (this.taskState.getValue() === TaskState.Stopped) {
      return;
    }

    await Promise.all([this.subtasks.stopAll(), this.onStopped()]);

    this.setTaskState(TaskState.Stopped);
  }

  /**
   * Runs the given list of tasks and promises, until they're completed
   * or until this task is halted. Returns true if they were all completed
   * before this task was stopped.
   */
  protected async workflow(
    ...fns: (Task<any> | Promise<any> | (() => Promise<any>) | (() => Task<any>))[]
  ): Promise<boolean> {
    for (let i = 0; i < fns.length; i++) {
      if (this.taskState.getValue() !== TaskState.Running) {
        return false;
      }

      const value = fns[i];
      let taskOrPromise = typeof value === 'function' ? value() : value;
      if (taskOrPromise instanceof Promise) {
        taskOrPromise = await taskOrPromise;
      }

      if (taskOrPromise instanceof Task) {
        await this.awaitSubtask(taskOrPromise);
      }
    }

    return true;
  }

  /**
   * Starts and keeps track of the given subtask.
   */
  protected async startSubtask(task: Task<T>): Promise<T> {
    this.subtasks.add(task);
    return task.start();
  }

  /**
   * Runs the subtask and waits for it to complete.
   */
  protected async awaitSubtask<R>(task: Task<R>): Promise<R> {
    this.subtasks.add(task);
    const retValue = await task.start();
    await task.untilStopped;
    return retValue;
  }

  /**
   * Called when stopping this task.
   */
  protected async onStopped(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Updates the state of the task.
   */
  protected setTaskState(state: TaskState) {
    if (state < this.taskState.getValue()) {
      throw new Error(`Cannot transition task state from ${this.taskState.getValue()} to ${state}`);
    }

    this.taskState.next(state);
  }
}
