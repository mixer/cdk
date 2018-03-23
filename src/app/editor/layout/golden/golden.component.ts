import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';

import { GoldenService } from './golden.service';

/**
 * Hosts the golden layout, which is the framework used for editor panels
 * within miix.
 */
@Component({
  selector: 'layout-golden',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoldenComponent {
  constructor(private readonly goldenService: GoldenService, private readonly el: ElementRef) {}

  public ngAfterViewInit() {
    this.goldenService.create(this.el.nativeElement);
  }

  public ngOnDestroy() {
    this.goldenService.destroy();
  }
}
