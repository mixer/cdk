import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
  ReflectiveInjector,
  Type,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as GoldenLayout from 'golden-layout';
import { filter, take } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { ControlsPanelComponent } from '../../controls/controls-panel/controls-panel.component';
import { ControlSchemaComponent } from '../control-schema/control-schema.component';
import { ClearGoldenLayout, GoldenPanel, SetGoldenLayout } from '../layout.actions';
import { goldenLayout, goldenPanels } from '../layout.reducer';

function setComponentRef<T>(container: GoldenLayout.Container, component: ComponentRef<T>) {
  (<any>container).ngComponent = component;
}

function getComponentRef<T>(container: GoldenLayout.Container): ComponentRef<T> | void {
  return (<any>container).ngComponent;
}

/**
 * The GoldenService handles initializing and destroying the GoldenLayout
 * and its relation to other Angular components.
 */
@Injectable()
export class GoldenService {
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
  ) {}

  /**
   * Creates the golden layout in the container.
   */
  public create(container: HTMLElement) {
    this.store
      .select(goldenPanels)
      .pipe(take(1))
      .subscribe(content => {
        const golden = new GoldenLayout({ content, ...this.defaultSettings }, container);

        this.registerComponent(golden, GoldenPanel.ControlSchema, ControlSchemaComponent);
        this.registerComponent(golden, GoldenPanel.Controls, ControlsPanelComponent);
        golden.init();

        this.store.dispatch(new SetGoldenLayout(golden));

        golden.on('itemDestroyed', (item: { container?: GoldenLayout.Container }) => {
          if (item.container) {
            const compRef = getComponentRef(item.container);
            if (compRef) {
              compRef.destroy();
            }
          }
        });
      });
  }

  /**
   * Destroys the current golden layout instance.
   */
  public destroy() {
    this.store
      .select(goldenLayout)
      .pipe(take(1), filter(layout => !!layout))
      .subscribe(golden => {
        golden!.destroy();
        this.store.dispatch(new ClearGoldenLayout());
      });
  }

  private registerComponent(golden: GoldenLayout, name: GoldenPanel, componentCtor: Type<any>) {
    // Note: the below function can't be an arrow, because Golden tries to
    // `new` it, which fails. So make an arrow and wrap it up.

    const factoryFn = (container: GoldenLayout.Container) => {
      const factory = this.componentFactoryResolver.resolveComponentFactory(componentCtor);
      const injector = ReflectiveInjector.resolveAndCreate(
        [{ provide: GoldenLayout, useValue: golden }],
        this.injector,
      );
      const compRef = factory.create(injector);

      container.getElement().append(compRef.location.nativeElement);
      setComponentRef(container, compRef);
      compRef.changeDetectorRef.detectChanges();
    };

    // tslint:disable-next-line
    golden.registerComponent(name, function(container: GoldenLayout.Container) {
      factoryFn(container);
    });
  }
}
