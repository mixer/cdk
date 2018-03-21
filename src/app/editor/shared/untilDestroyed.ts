import { OnDestroy } from '@angular/core';
import { UnaryFunction } from 'rxjs/interfaces';
import { Observable } from 'rxjs/Observable';
import { takeUntil } from 'rxjs/operators';
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
