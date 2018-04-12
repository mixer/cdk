import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { _throw } from 'rxjs/observable/throw';
import { catchError } from 'rxjs/operators';

/**
 * Like Bluebird.catch, predicated by a constructor, but for observables.
 */
export function catchErrorType<T, R = void>(
  ctor: new (...args: any[]) => T,
  handler: (err: T) => R | Promise<R> | Observable<R>,
) {
  return catchError(err => {
    if (!(err instanceof ctor)) {
      return _throw(err);
    }

    const out = handler(err);
    if (out instanceof Observable) {
      return out;
    }
    if (out instanceof Promise) {
      return fromPromise(out);
    }

    return of(out);
  });
}
