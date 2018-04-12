import { Selector } from '@ngrx/store';
import * as patch from 'fast-json-patch';
import { omit } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { distinctUntilChanged, pairwise, startWith, switchMap } from 'rxjs/operators';

import { mapSet, setSub } from '../../shared/ds';

/**
 * Represents some method call that can be made to the controls.
 */
export interface ICall {
  method: string;
  params: object;
}

/**
 * Source represents source code for a resource in Interactive.
 */
export abstract class Source<T> {
  /**
   * Returns a stream of events to send to the embedded frame. This shuld
   * generally emit whenever the source code is updated.
   */
  public getEvents(src: Observable<T>): Observable<ICall> {
    return src.pipe(
      distinctUntilChanged(),
      startWith<T | null>(null),
      pairwise(),
      switchMap(([previous, current]) => {
        if (previous) {
          return of(...this.compare(previous, current!));
        }

        return of(...this.createPacket(current!));
      }),
    );
  }

  /**
   * Called when the underlying JSON changes. Should return an array of calls
   * to make to update the interactive state from the old state to the new.
   */
  public abstract compare(previous: T, next: T): ICall[];

  /**
   * Returns the selector to read the source data structure from the store.
   */
  public abstract getSelector(): Selector<object, T>;

  /**
   * Returns a method call to make in order to create this source's resources,
   * from the given state.
   */
  protected abstract createPacket(source: T): ICall[];
}

export interface IResourceComparatorOptions<T> {
  id: keyof T;
  nested?: { [K in keyof T]?: IResourceComparatorOptions<any> };
  create(sources: T[], context: any): ICall | ICall[];
  update(sources: T[], context: any): ICall | ICall[];
  destroy(id: string, context: any): ICall | ICall[];
}

/**
 * ResourceComparator creates set set of create, update, and destroy
 * calls from a comparison between two resource types.
 */
export class ResourceComparator<T> {
  private nested: { [K in keyof T]?: ResourceComparator<T[K]> } = Object.create(null);
  private nestedKeys: (keyof T)[] = [];

  constructor(private readonly opts: IResourceComparatorOptions<T>) {
    this.nestedKeys = <(keyof T)[]>Object.keys(opts.nested || {});

    this.nestedKeys.forEach(key => {
      this.nested[key] = new ResourceComparator(opts.nested![key]!);
    });
  }

  /**
   * Creates calls to update from A to B.
   */
  public compare(previous: T[], next: T[], context?: any): ICall[] {
    let calls: ICall[] = this.compareTopLevel(previous, next, context);

    previous.forEach(nestedPrev => {
      // We only need to deep-diff resources that survived through the change.
      // If it only exists in the previous or next,
      // we don't need to do anything.
      const nestedNext = next.find(up => this.id(up) === this.id(nestedPrev));
      if (!nestedNext) {
        return;
      }

      Object.keys(this.nested).forEach((key: keyof T) => {
        calls = calls.concat(
          (<any>this.nested)[key].compare(nestedPrev[key] || [], nestedNext[key] || [], nestedNext),
        );
      });
    });

    return calls;
  }

  private compareTopLevel(previous: T[], next: T[], context: any): ICall[] {
    const update = new Set<string>();
    const create = new Set<string>();
    const destroy = new Set<string>();

    const working: T[] = patch.deepClone(previous);

    patch.compare(previous, next).forEach(op => {
      const path = op.path.split('/').slice(1);
      const index = Number(path[0]);
      const prop = <keyof T>path[1];
      if (typeof index !== 'number') {
        return; // todo(connor4312): print error
      }
      if (this.nested[prop]) {
        return; // we'll get to these later.
      }

      const id = index < working.length ? this.id(working[index]) : undefined;
      switch (op.op) {
        case 'replace':
          if (prop !== this.opts.id) {
            update.add(id!);
            break;
          }

          create.add(op.value);
          destroy.add(id!);
          break;
        case 'remove':
          if (prop === undefined || prop === this.opts.id) {
            destroy.add(id!);
          } else {
            update.add(id!);
          }
          break;
        case 'add':
          if (prop === undefined) {
            create.add(op.value[this.opts.id]);
          } else if (prop === this.opts.id) {
            create.add(op.value);
          } else {
            update.add(id!);
          }
          break;
        default:
          update.add(id!);
      }

      patch.applyOperation(working, op);
    });

    let calls: (ICall | ICall[])[] = [];
    if (destroy.size) {
      calls = calls.concat(mapSet(destroy, id => this.opts.destroy(id, context)));
    }
    if (create.size) {
      const toCreate = mapSet(create, id => <T>next.find(x => this.id(x) === id));
      calls = calls.concat(this.opts.create(toCreate, context));
    }
    if (update.size) {
      const toUpdate = setSub(update, destroy, create);
      const resources = mapSet(toUpdate, id => <T>next.find(x => this.id(x) === id));
      calls = calls.concat(
        this.opts.update(resources.map(r => <any>omit(r, this.nestedKeys)), context),
      );
    }

    return calls.reduce<ICall[]>((acc, c) => acc.concat(c), []);
  }

  private id(instance: T): string {
    return <any>instance[this.opts.id];
  }
}
