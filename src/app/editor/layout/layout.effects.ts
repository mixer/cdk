import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import * as GoldenLayout from 'golden-layout';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { of } from 'rxjs/observable/of';
import { debounceTime, filter, map, mapTo, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { combineLatest } from 'rxjs/operators/combineLatest';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { ProjectActionTypes, SetOpenProject } from '../project/project.actions';
import * as fromProject from '../project/project.reducer';
import {
  ClosePanel,
  findGoldenPanel,
  focus,
  LayoutActionTypes,
  LayoutMethod,
  LayoutScreen,
  OpenPanel,
  OpenScreen,
  panelTitles,
  SavePanels,
  SetGoldenLayout,
} from './layout.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class LayoutEffects {
  /**
   * Fired when we're loading up a new project. Gets the saved panels
   * from the server and moves to the next screen.
   */
  @Effect()
  public readonly startOpen = this.actions
    .ofType<SetOpenProject>(ProjectActionTypes.SET_OPEN_PROJECT)
    .pipe(
      switchMap(action =>
        this.electron.call<GoldenLayout.ItemConfigType[] | null>(LayoutMethod.LoadPanels, {
          project: action.project.directory,
        }),
      ),
      switchMap(panels => {
        const open = new OpenScreen(LayoutScreen.Editor);
        if (!panels) {
          return of(open);
        }

        return of<Action>(new SavePanels(panels, false), open);
      }),
    );

  /**
   * Goes back to the welcome screen when we close a project.
   */
  @Effect()
  public readonly closeProject = this.actions
    .ofType(ProjectActionTypes.CLOSE_PROJECT)
    .pipe(mapTo(new OpenScreen(LayoutScreen.Welcome)));

  /**
   * Persists panel configuration to the server when it chamges.
   */
  @Effect({ dispatch: false })
  public readonly savePanels = this.actions
    .ofType<SavePanels>(LayoutActionTypes.PANELS_SAVE)
    .pipe(
      filter(action => action.propogateToServer),
      combineLatest(this.store.select(fromProject.directory).pipe(filter(Boolean), take(1))),
      switchMap(([action, project]) =>
        this.electron.call(LayoutMethod.SavePanels, { panels: action.panels, project }),
      ),
    );

  /**
   * Emits an action to save the layout's panels when they change.
   */
  @Effect()
  public readonly saveGoldenPanelsOnChange = this.withLayout(layout =>
    fromEvent(layout, 'stateChanged').pipe(
      debounceTime(50),
      map(() => new SavePanels(layout.toConfig().content)),
    ),
  );

  /**
   * Runs a close panel action on the layout.
   */
  @Effect({ dispatch: false })
  public readonly closeGoldenPanel = this.withLayout(layout =>
    this.actions.ofType<ClosePanel>(LayoutActionTypes.CLOSE_PANEL).pipe(
      tap(action => {
        const panel = findGoldenPanel([layout.root], action.panel);
        if (panel) {
          panel.remove();
        }
      }),
    ),
  );

  /**
   * Runs an open panel action against the layout.
   */
  @Effect({ dispatch: false })
  public readonly openGoldenPanel = this.withLayout(layout =>
    this.actions.ofType<OpenPanel>(LayoutActionTypes.OPEN_PANEL).pipe(
      tap(({ panel, locator }) => {
        const existing = findGoldenPanel([layout.root], panel);
        if (existing) {
          focus(existing);
          return; // don't open the panel if it already exists
        }

        let parent: GoldenLayout.ContentItem | null = null;
        if (locator) {
          parent = locator(layout);
        }
        if (!parent) {
          parent = layout.root.contentItems[0] || layout.root;
        }

        parent.addChild({
          type: 'component',
          componentName: panel,
          title: panelTitles[panel],
        });
      }),
    ),
  );

  /**
   * Resizes the layout when the window is resized.
   */
  @Effect({ dispatch: false })
  public readonly resizeGolden = this.withLayout(layout =>
    fromEvent(window, 'resize').pipe(tap(() => layout.updateSize())),
  );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  private withLayout<T>(fn: (layout: GoldenLayout) => Observable<T>): Observable<T> {
    return this.actions
      .ofType<SetGoldenLayout>(LayoutActionTypes.SET_GOLDEN_LAYOUT)
      .pipe(
        switchMap(action =>
          fn(action.layout).pipe(
            takeUntil(this.actions.ofType<SetGoldenLayout>(LayoutActionTypes.CLEAR_GOLDEN_LAYOUT)),
          ),
        ),
      );
  }
}
