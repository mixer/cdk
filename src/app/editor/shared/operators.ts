import { OnDestroy } from '@angular/core';
import { UnaryFunction } from 'rxjs/interfaces';
import { Observable } from 'rxjs/Observable';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/**
 * untilDestroyed returns a function that can be used in an observable's pipe
 * to unsubscribe when the component is destroyed.
 *
 * @example
 * mixer.display.video()
 *   .pipe(untilUnmount(this))
 *   .subscribe(settings => this.updateSettings(settings));
 */
export function untilDestroyed<T>(
  component: OnDestroy,
): UnaryFunction<Observable<T>, Observable<T>> {
  const inner = component.ngOnDestroy;
  const notifier = new ReplaySubject<void>(1);
  component.ngOnDestroy = function() {
    notifier.next(undefined);
    if (inner) {
      // tslint:disable-next-line
      inner.apply(this, arguments);
    }
  };

  return takeUntil<T>(notifier);
}

/**
 * toLatestFrom merges the last result of the given
 * observable to this chain.
 */
export function toLatestFrom<T>(
  other: Observable<T>,
): UnaryFunction<Observable<any>, Observable<T>> {
  return switchMap(() => other.pipe(take(1)));
}

const boolFilter = filter(Boolean);

/**
 * toLatestFrom merges the last result of the given
 * observable to this chain.
 */
export function truthy<T>(): UnaryFunction<Observable<T | void | undefined | null>, Observable<T>> {
  return boolFilter;
}
