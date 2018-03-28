import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { pairwise, startWith } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { CloseMask, OpenMask } from './content-mask.actions';
import { isOpen } from './content-mask.reducer';

/**
 * Service that appends and removes the content mask element from the page.
 */
@Injectable()
export class ContentMaskService {
  private el: HTMLElement;

  constructor(private readonly store: Store<fromRoot.IState>) {
    // We could use a component here and should if it gets more advanced, but this
    // is very basic, the dance we need for mounting and such is far more complex.
    this.el = document.createElement('div');
    this.el.classList.add('content-mask');

    store
      .select(isOpen)
      .pipe(startWith(false), pairwise())
      .subscribe(([wasOpen, nowOpen]) => {
        if (!wasOpen && nowOpen) {
          document.body.appendChild(this.el);
        } else if (wasOpen && !nowOpen) {
          document.body.removeChild(this.el);
        }
      });
  }

  public open() {
    this.store.dispatch(new OpenMask());
  }

  public close() {
    this.store.dispatch(new CloseMask());
  }
}
