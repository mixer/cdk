import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { timer } from 'rxjs/observable/timer';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { CommonMethods } from '../../bedrock.actions';

import * as fromAccount from '../../account/account.reducer';
import * as fromRoot from '../../bedrock.reducers';
import { ElectronService } from '../../electron.service';
import { createRandomProjectName } from '../../shared/name-generator';
import { projectNameValidator } from '../../shared/validators';
import { ChangeScreen, NewProjectScreen, SetDetails } from '../new-project.actions';
import * as fromNewProject from '../new-project.reducer';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'new-project-attribute-selection',
  templateUrl: './attribute-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeSelectionComponent {
  /**
   * Form for input validation.
   */
  public form: FormGroup;
  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly formBuilder: FormBuilder,
    private readonly electron: ElectronService,
  ) {}

  public ngOnInit() {
    this.form = this.formBuilder.group({
      author: ['Your Name', Validators.required],
      projectName: [
        createRandomProjectName(),
        [Validators.required, projectNameValidator],
        this.checkProjectNameAvailable,
      ],
      license: 'MIT',
      description: '',
      keywords: '',
    });

    this.store
      .select(fromAccount.currentUser)
      .pipe(take(1), filter(user => !!user))
      .subscribe(account => this.form.get('author')!.setValue(account!.username));

    this.store
      .select(fromNewProject.details)
      .pipe(take(1), filter(details => !!details))
      .subscribe(details => this.form.setValue(details!));
  }

  public getInput(name: string) {
    return this.form.get(name)!;
  }

  public submit() {
    const data = { ...this.form.value };
    data.license = data.license || 'Unlicensed'; // if they left license blank

    this.store.dispatch(new SetDetails(data));
    this.store.dispatch(new ChangeScreen(NewProjectScreen.Template));
  }

  public back() {
    this.store.dispatch(new ChangeScreen(NewProjectScreen.Layout));
  }

  private checkProjectNameAvailable: AsyncValidatorFn = control => {
    return timer(750).pipe(
      switchMap(() =>
        this.electron.call(CommonMethods.CheckBundleNameTaken, { name: control.value }),
      ),
      map(taken => (taken ? { projectNameTaken: { value: control.value } } : null)),
    );
  };
}
