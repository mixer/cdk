import { ChangeDetectionStrategy, Component, ElementRef, HostListener } from '@angular/core';

import 'rxjs/add/operator/map';

import { CodeState } from '../redux/code';
import { ProjectService } from '../redux/project';
import { captureDrag } from '../util/drag';
import { MouseButtons } from '../util/mouseButtons';

/**
 * The code reizer component is a draggable bar that allows the user to
 * set the width of the code / display components.
 */
@Component({
  selector: 'code-resizer',
  template: '<div></div>',
  styleUrls: ['./code-resizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeResizerComponent {
  /**
   * Width under which the code box will hide.
   */
  private static hideThreshold = 300;

  private el: HTMLElement;
  private nextWidth: number | null;
  private wantsToHide: boolean | null;

  constructor(el: ElementRef, private readonly project: ProjectService) {
    this.el = el.nativeElement;
  }

  public ngOnDestroy() {
    // noop
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  public startDrag(startEv: MouseEvent | TouchEvent) {
    if (startEv instanceof MouseEvent && startEv.button !== MouseButtons.Primary) {
      return;
    }

    this.el.classList.add('active');
    captureDrag(startEv)
      .takeUntilDestroyed(this)
      .subscribe(
        ev => {
          this.updatePosition(ev);
        },
        err => {
          throw err;
        },
        () => {
          this.applyPosition();
        },
      );
  }

  private applyPosition() {
    if (this.wantsToHide) {
      this.project.setCodeState(CodeState.Closed);
      return;
    }

    this.project.setCodeWidth(this.nextWidth!);
    this.el.style.transform = 'none';
    this.el.classList.remove('active', 'will-hide');
    this.wantsToHide = null;
    this.nextWidth = null;
  }

  private updatePosition(ev: MouseEvent | Touch) {
    const width = Math.min(this.getMaxWidth(), ev.pageX);
    this.el.style.transform = `translateX(${width}px)`;
    this.nextWidth = width;

    const hide = this.shouldHide(width);
    if (hide !== this.wantsToHide) {
      this.wantsToHide = hide;
      this.el.classList.toggle('will-hide', hide);
    }
  }

  private getMaxWidth(): number {
    return window.innerWidth * 0.66;
  }

  private shouldHide(width: number): boolean {
    return width < CodeResizerComponent.hideThreshold;
  }
}
