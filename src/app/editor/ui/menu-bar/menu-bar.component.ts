import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, HostListener, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { take, map, filter, takeUntil, switchMap } from 'rxjs/operators';

import { State } from '../../bedrock.reducers';
import * as fromMenu from './menu-bar.reducer';
import { OpenMenu, CloseMenu } from './menu-bar.actions';
import { untilDestroyed } from '../../shared/untilDestroyed';

/**
 * The MenuBarComponent is a simple drop-down menu.
 */
@Component({
  selector: 'menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarComponent implements OnDestroy {
  /**
   * Text to display in the menu bar.
   */
  @Input() public text: string;

  /**
   * A unique ID for this menu.
   */
  @Input() public menuId: string;

  /**
   * Whether the menu is currently open.
   */
  public readonly isOpen: Observable<boolean> = this.state
    .select(fromMenu.selectOpenMenu)
    .pipe(map(menu => menu === this.menuId));

  constructor(private readonly state: Store<State>, el: ElementRef) {
    const htmlElement: HTMLElement = el.nativeElement;

    this.state
      .select(fromMenu.selectOpenMenu)
      .pipe(map(menu => menu === this.menuId), untilDestroyed(this))
      .subscribe(isOpen => {
        htmlElement.classList[isOpen ? 'add' : 'remove']('active');
      });

    this.isOpen
      .pipe(
        filter(Boolean),
        switchMap(() => fromEvent<MouseEvent>(window, 'mousedown').pipe(
          filter(ev => !htmlElement.contains(<Node> ev.target)),
          takeUntil(this.isOpen.pipe(filter(open => !open))),
          untilDestroyed(this),
        )),
      )
      .subscribe(() => this.close());
  }

  public ngOnDestroy() {
    /* noop */
  }

  /**
   * Moves focus to this menu on hover, if any menu is open.
   */
  @HostListener('mouseenter')
  public onHover() {
    this.state
      .select(fromMenu.selectOpenMenu)
      .pipe(take(1), filter(Boolean))
      .subscribe(() => this.open());
  }

  /**
   * Toggles whether the item is open or closed.
   */
  public toggle(event: Event) {
    event.preventDefault();

    this.isOpen
      .pipe(take(1))
      .subscribe(isOpen => isOpen ? this.close() : this.open());
  }

  /**
   * Closes the menu.
   */
  public close() {
    this.state.dispatch(new CloseMenu(this.menuId));
  }

  /**
   * Opens the menu.
   */
  public open() {
    this.state.dispatch(new OpenMenu(this.menuId));
  }
}

/**
 * The MenuBarItemComponent is an entry in the menu bar.
 */
@Component({
  selector: 'menu-bar-item',
  templateUrl: './menu-bar-item.component.html',
  styleUrls: ['./menu-bar-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarItemComponent {
  /**
   * Text to display in the menu bar bar item.
   */
  @Input() public text: string;

  /**
   * Whether this item is disabled.
   */
  @Input() public disabled: boolean;

  /**
   * Icon to display in the menu bar item.
   */
  @HostBinding('class.disabled')
  @Input() public icon: boolean;

  constructor(private readonly parent: MenuBarComponent) {}

  @HostListener('click')
  public onClick() {
    this.parent.close();
  }
}

/**
 * The MenuBarDivider divides sections in a menu-bar dropdown.
 */
@Component({
  selector: 'menu-bar-divider',
  template: '',
  styleUrls: ['./menu-bar-divider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBarDividerComponent {}
