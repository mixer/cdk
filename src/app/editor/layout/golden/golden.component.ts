import { ChangeDetectionStrategy, Component, ElementRef, ViewContainerRef } from '@angular/core';

import { GoldenService } from './golden.service';

/**
 * Hosts the golden layout, which is the framework used for editor panels
 * within miix.
 */
@Component({
  selector: 'layout-golden',
  template: '',
  styleUrls: ['./golden.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoldenComponent {
  constructor(
    private readonly goldenService: GoldenService,
    private readonly viewRef: ViewContainerRef,
    private readonly el: ElementRef,
  ) {}

  public ngAfterViewInit() {
    this.goldenService.create(this.el.nativeElement, this.viewRef);
  }

  public ngOnDestroy() {
    this.goldenService.destroy();
  }
}
