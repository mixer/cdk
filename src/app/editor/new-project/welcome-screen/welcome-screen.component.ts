import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NewProjectService } from '../new-project.service';

/**
 * The welcome screen is the first screen shown to users when they open the
 * window. Contains some "hello" fluff.
 */
@Component({
  selector: 'new-project-welcome-screen',
  templateUrl: './welcome-screen.component.html',
  styleUrls: ['./welcome-screen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeScreenComponent {
  constructor(private readonly project: NewProjectService) {}

  public cancel() {
    this.project.cancel();
  }

  public create() {
    this.project.chooseDirectory();
  }
}
