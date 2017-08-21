import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { ISubscription, Subscription } from 'rxjs/Subscription';
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError';

/**
 * MemorizingSubject acts like a BehaviorSubject, except that it is seeded
 * with no value, calls to getValue() will fail before the first `next` call,
 * and it does not push a value to subscribers if `next` has not been called.
 */
export class MemorizingSubject<T> extends Subject<T> {
  protected value: T;
  protected hasSet = false;

  public hasValue(): boolean {
    return this.hasSet;
  }

  public next(value: T): void {
    this.hasSet = true;
    super.next((this.value = value));
  }
  public getValue(): T {
    if (this.hasError) {
      throw this.thrownError;
    }
    if (this.closed) {
      throw new ObjectUnsubscribedError();
    }
    if (!this.hasSet) {
      throw new Error(
        'Attempted to call `getValue` on a MemorizingSubject' +
          'which did not previous have its value set.',
      );
    }
    return this.value;
  }

  // tslint:disable-next-line
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    const subscription = super._subscribe(subscriber);
    if (subscription && this.hasSet && !(<ISubscription>subscription).closed) {
      subscriber.next(this.value);
    }
    return subscription;
  }
}
