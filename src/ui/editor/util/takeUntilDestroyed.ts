import { OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Operator } from 'rxjs/Operator';
import { OuterSubscriber } from 'rxjs/OuterSubscriber';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { TeardownLogic } from 'rxjs/Subscription';
import { subscribeToResult } from 'rxjs/util/subscribeToResult';

/**
 * TakeUntilDestroyedSubscriber subscribes to an observable and automatically
 * unsubscribes when teh provided component is destroyed.
 */
class TakeUntilDestroyedSubscriber<T, R> extends OuterSubscriber<T, R> {
  private onDestroyed = new Subject<void>();

  constructor(destination: Subscriber<any>, component: OnDestroy) {
    super(destination);
    this.add(subscribeToResult(this, this.onDestroyed));

    const origOnDestroy = component.ngOnDestroy;
    component.ngOnDestroy = () => {
      this.onDestroyed.next();
      if (origOnDestroy) {
        origOnDestroy.call(component);
      }
    };
  }

  public notifyNext(): void {
    this.complete();
  }

  public notifyComplete(): void {
    // noop
  }
}

/**
 * Operator that implements the TakeUntilDestroyedSubscriber.
 */
class TakeUntilDestroyedOperator<T> implements Operator<T, T> {
  constructor(private component: OnDestroy) {}

  public call(subscriber: Subscriber<T>, source: any): TeardownLogic {
    return source.subscribe(new TakeUntilDestroyedSubscriber(subscriber, this.component));
  }
}

export function takeUntilDestroyed<T>(this: Observable<T>, component: OnDestroy): Observable<T> {
  // tslint:disable-next-line:no-invalid-this
  return this.lift(new TakeUntilDestroyedOperator(component));
}

Observable.prototype.takeUntilDestroyed = takeUntilDestroyed;

declare module 'rxjs/Observable' {
  // tslint:disable-next-line
  interface Observable<T> {
    takeUntilDestroyed: typeof takeUntilDestroyed;
  }
}
