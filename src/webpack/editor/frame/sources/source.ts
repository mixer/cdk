import * as patch from 'fast-json-patch';
import { parse } from 'json5';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeAll';

import { ICodeState } from '../../redux/code';
import { mapSet, omit, setSub } from '../../util/ds';

export interface ICall {
  method: string;
  params: object;
}

/**
 * Source represents source code for a resource in Interactive.
 */
export abstract class Source<T> {
  private lastSrc: T;

  /**
   * Returns a stream of events to send to the embedded frame. This shuld
   * generally emit whenever the source code is updated.
   */
  public getEvents(src: Observable<ICodeState>): Observable<ICall[]> {
    const prop = this.sourceProp();

    return src
      .map(state => (<string[]>state[prop]).join('\n'))
      .distinctUntilChanged()
      .map(text => {
        try {
          return parse(text);
        } catch (e) {
          return null;
        }
      })
      .filter(s => !!s)
      .map(parsed => {
        if (this.lastSrc) {
          const calls = this.compare(this.lastSrc, parsed);
          this.lastSrc = parsed;
          return calls;
        }

        this.lastSrc = parsed;
        return [this.createPacket(this.lastSrc)];
      });
  }

  /**
   * Returns a packet to recreate the resources this source owns, if possible.
   */
  public getCreatePacket(): ICall | undefined {
    if (!this.lastSrc) {
      return undefined;
    }

    return this.createPacket(this.lastSrc);
  }

  /**
   * Called when the underlying JSON changes. Should return an array of calls
   * to make to update the interactive state from the old state to the new.
   */
  public abstract compare(previous: T, next: T): ICall[];

  /**
   * Returns the key of the CodeState where this source reads data from.
   */
  protected abstract sourceProp(): keyof ICodeState;

  /**
   * Returns a method call to make in order to create this source's resources,
   * from the given state.
   */
  protected abstract createPacket(source: T): ICall;
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
      calls = calls.concat(this.opts.update(resources.map(r => omit(r, this.nestedKeys)), context));
    }

    return calls.reduce<ICall[]>((acc, c) => acc.concat(c), []);
  }

  private id(instance: T): string {
    return <any>instance[this.opts.id];
  }
}
