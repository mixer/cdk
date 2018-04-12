import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

/**
 * Directive to bind an observable to the src on an iframe. We do this instead
 * of just `[src]="foo | async"` since the async pipe emits null initially,
 * which will cause the iframe to load /null and cause unnecessary errors.
 */
@Directive({ selector: '[iframeSrc]' })
export class IframeSrcDirective implements OnDestroy, OnChanges {
  /**
   * Observable of the URL to open
   */
  @Input() public iframeSrc: Observable<string | void | null>;

  private sub: Subscription | undefined;
  private el: HTMLIFrameElement;

  constructor(el: ElementRef) {
    this.el = el.nativeElement;
  }

  public ngOnChanges(_changes: SimpleChanges) {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
    if (!this.iframeSrc) {
      return;
    }

    this.sub = this.iframeSrc.subscribe(url => {
      if (url) {
        this.el.src = url;
      }
    });
  }

  public ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
