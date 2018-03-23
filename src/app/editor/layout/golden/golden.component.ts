import {
  ChangeDetectionStrategy,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ReflectiveInjector,
  Type,
  ViewChild,
} from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as GoldenLayout from 'golden-layout';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { filter, take, takeUntil } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { ControlSchemaComponent } from '../control-schema/control-schema.component';
import { ControlsComponent } from '../controls/controls.component';
import {
  ClosePanel,
  GoldenPanel,
  LayoutActionTypes,
  OpenPanel,
  panelTitles,
  SavePanels,
} from '../layout.actions';
import { goldenPanels } from '../layout.reducer';

function setComponentRef(container: GoldenLayout.Container, component: ComponentRef<any>) {
  (<any>container).ngComponent = component;
}

function getComponentRef(container: GoldenLayout.Container): ComponentRef<any> | void {
  return (<any>container).ngComponent;
}

/**
 * Hosts the golden layout, which is the framework used for editor panels
 * within miix.
 */
@Component({
  selector: 'layout-golden',
  template: `<div class="layout" #layout></div>`,
  styleUrls: ['./golden.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoldenComponent implements OnDestroy {
  /**
   * Element to mount the component in.
   */
  @ViewChild('layout') private layout: ElementRef;

  /**
   * Reference to the golden layout.
   */
  private golden: GoldenLayout;

  /**
   * Configuration for the golden layout.
   */
  private defaultSettings: GoldenLayout.Config = {
    settings: {
      constrainDragToContainer: true,
      showPopoutIcon: false,
    },
  };

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly injector: Injector,
    private readonly store: Store<fromRoot.IState>,
    private readonly actions: Actions,
  ) {}

  public ngAfterViewInit() {
    this.store
      .select(goldenPanels)
      .pipe(take(1))
      .subscribe(content => {
        this.golden = new GoldenLayout(
          { content, ...this.defaultSettings },
          this.layout.nativeElement,
        );
        this.registerComponent(GoldenPanel.ControlSchema, ControlSchemaComponent);
        this.registerComponent(GoldenPanel.Controls, ControlsComponent);
        this.golden.init();

        this.golden.on('stateChanged', () => {
          this.store.dispatch(new SavePanels(this.golden.toConfig().content));
        });

        this.golden.on('itemDestroyed', (item: { container?: GoldenLayout.Container }) => {
          if (item.container) {
            const compRef = getComponentRef(item.container);
            if (compRef) {
              compRef.destroy();
            }
          }
        });
      });

    this.actions
      .ofType(LayoutActionTypes.OPEN_PANEL)
      .pipe(untilDestroyed(this))
      .subscribe((panel: OpenPanel) => {
        const parent = this.golden.root.contentItems[0] || this.golden.root;

        parent.addChild({
          type: 'component',
          componentName: panel.panel,
          title: panelTitles[panel.panel],
        });
      });
  }

  public ngOnDestroy() {
    // noop
  }

  @HostListener('window:resize')
  public onResize() {
    if (this.layout) {
      this.golden.updateSize();
    }
  }

  private registerComponent(name: GoldenPanel, componentCtor: Type<any>) {
    // Note: the below function can't be an arrow, because Golden tries to
    // `new` it, which fails. So make an arrow and wrap it up.

    const factoryFn = (container: GoldenLayout.Container) => {
      const factory = this.componentFactoryResolver.resolveComponentFactory(componentCtor);
      const injector = ReflectiveInjector.resolveAndCreate(
        [{ provide: GoldenLayout, useValue: this.layout }],
        this.injector,
      );
      const compRef = factory.create(injector);

      container.getElement().append(compRef.location.nativeElement);
      setComponentRef(container, compRef);

      this.actions
        .ofType(LayoutActionTypes.CLOSE_PANEL)
        .pipe(
          filter((action: ClosePanel) => action.panel === name),
          untilDestroyed(this),
          takeUntil(fromEvent(container, 'destroy')),
        )
        .subscribe(() => container.close());

      compRef.changeDetectorRef.detectChanges();
    };

    // tslint:disable-next-line
    this.golden.registerComponent(name, function(container: GoldenLayout.Container) {
      factoryFn(container);
    });
  }
}
