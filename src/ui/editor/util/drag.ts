import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/takeUntil';

function touchMatcher(touch: Touch): (ev: TouchEvent) => Touch | undefined {
  return ev => Array.from(ev.changedTouches).find(t => t.identifier === touch.identifier);
}

/**
 * Captures a MouseEvent or TouchEvent (from touchstart or mousedown) and
 * returns an observable that emits when the pointer or finger is dragged.
 */
export function captureDrag(ev: MouseEvent | TouchEvent): Observable<MouseEvent | Touch> {
  ev.preventDefault();

  if (ev instanceof MouseEvent) {
    return Observable.fromEvent<MouseEvent>(window, 'mousemove')
      .startWith(ev)
      .takeUntil(Observable.fromEvent(window, 'mouseup'));
  }

  const match = touchMatcher(ev.touches[0]);
  return Observable.fromEvent<TouchEvent>(window, 'touchmove')
    .startWith(ev)
    .map(match)
    .filter(Boolean)
    .takeUntil(
      Observable.fromEvent<TouchEvent>(window, 'touchend')
        .map(match)
        .filter(Boolean),
    );
}
