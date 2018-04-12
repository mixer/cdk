import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';

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
    return fromEvent<MouseEvent>(window, 'mousemove').pipe(
      startWith(ev),
      takeUntil(dragCancelled(ev)),
    );
  }

  const match = touchMatcher(ev.touches[0]);
  return fromEvent<TouchEvent>(window, 'touchmove').pipe(
    startWith(ev),
    map(match),
    filter(Boolean),
    takeUntil(dragCancelled(ev)),
  );
}

/**
 * Returns an observable that fires once the drag stops.
 */
export function dragCancelled(ev: MouseEvent | TouchEvent): Observable<void> {
  return ev instanceof MouseEvent
    ? fromEvent(window, 'mouseup')
    : fromEvent<TouchEvent>(window, 'touchend').pipe(
        map(touchMatcher(ev.touches[0])),
        filter(Boolean),
      );
}
