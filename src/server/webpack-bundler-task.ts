import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { bundleEnv } from '@mcph/miix-webpack-plugin/dist/src/bundle-emitter';
import {
  Notification,
  notificationEnv,
  NotificationType,
} from '@mcph/miix-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { map } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { WebpackState } from '../app/editor/controls/controls.actions';
import { spawnPackageScript } from './npm-exec';
import { WebpackTask } from './webpack-task';

export interface IBundleData {
  tarballLocation: string;
  metadata: IPackageConfig;
}

/**
 * WebpackBundleTask builds the project into a tarball. It returns an
 * observable that emits information about the tarball and its metadata.
 */
export class WebpackBundleTask extends WebpackTask<Observable<IBundleData>> {
  private metadata = new ReplaySubject<IPackageConfig>(1);
  private tarball = new ReplaySubject<string>(1);

  /**
   * @override
   */
  protected async startWebpack(config: string): Promise<[Observable<IBundleData>, ChildProcess]> {
    const process = spawnPackageScript(
      this.project.baseDir(),
      'webpack',
      ['--config', config, '--color'],
      {
        cwd: this.project.baseDir(),
        env: {
          ENV: 'production',
          NODE_ENV: 'production',
          [bundleEnv]: '1',
          [notificationEnv]: '1',
        },
      },
    );

    return [
      combineLatest(this.metadata, this.tarball).pipe(
        map(([metadata, tarballLocation]) => ({ metadata, tarballLocation })),
      ),
      process,
    ];
  }

  /**
   * @override
   */
  protected handleNotification(notification: Notification) {
    super.handleNotification(notification);

    switch (notification.kind) {
      case NotificationType.Metadata:
        this.metadata.next(notification.metadata);
        break;
      case NotificationType.BundleCreated:
        this.tarball.next(notification.location);
        break;
      case NotificationType.BundleFailed:
        this.state.next(WebpackState.Failed);
        break;
      default:
      // ignored
    }
  }
}
