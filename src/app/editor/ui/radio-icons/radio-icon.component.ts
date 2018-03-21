import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'radio-icon-list',
  template: '<ng-content></ng-content>',
  styleUrls: ['./radio-icon-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioIconListComponent {
  /**
   * The currently selected value.
   */
  @Input()
  public set value(value: string) {
    this.value$.next(value);
  }

  /**
   * Fired when the selected element should change.
   */
  @Output() public change = new Subject<string>();

  /**
   * Observable of the currently set value.
   */
  public value$ = new ReplaySubject(1);
}

/**
 * A radio icon is a displayed selection icon, for use in a radio-icon-list.
 */
@Component({
  selector: 'radio-icon',
  templateUrl: './radio-icon.component.html',
  styleUrls: ['./radio-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioIconComponent implements OnInit {
  /**
   * The name of this selection.
   */
  @Input() public value: string;

  /**
   * URL of the icon to display.
   */
  @Input() public icon: string;

  /**
   * Optional name/title for the icon.
   */
  @Input() public name: string;

  /**
   * Square size of icons to be displayed/
   */
  @Input()
  @HostBinding('style.width.px')
  public iconSize: number = 128;

  /**
   * Element role for accessibility.
   */
  @HostBinding('attr.role') public role: string = 'button';

  constructor(private readonly list: RadioIconListComponent, private readonly el: ElementRef) {}

  public ngOnInit() {
    this.list.value$.subscribe(selected => {
      this.el.nativeElement.classList[selected === this.value ? 'add' : 'remove']('selected');
    });
  }

  /**
   * Selections this radio icon.
   */
  @HostListener('click')
  public select() {
    this.list.change.next(this.value);
  }
}
