import { IPackageConfig } from '@mixer/cdk-std/dist/internal';
import { bundleEnv } from '@mixer/cdk-webpack-plugin/dist/src/bundle-emitter';
import {
  IBundleCreated,
  Notification,
  notificationEnv,
  NotificationType,
} from '@mixer/cdk-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter, merge, switchMap, take } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { WebpackState } from '../app/editor/controls/controls.actions';
import { WebpackBundlerError } from './errors';
import { spawnPackageScript } from './npm-exec';
import { Uploader } from './publish/uploader';
import { WebpackTask } from './webpack-task';

export interface IBundleData {
  tarball: string;
  metadata: IPackageConfig;
  readme: string | null;
}

/**
 * WebpackBundleTask builds the project into a tarball. It returns an
 * observable that emits information about the tarball and its metadata.
 */
export class WebpackBundleTask extends WebpackTask<Promise<IBundleData>> {
  private metadata = new ReplaySubject<IPackageConfig>(1);
  private bundled = new ReplaySubject<IBundleCreated>(1);

  /**
   * @override
   */
  protected async startWebpack(config: string): Promise<[Promise<IBundleData>, ChildProcess]> {
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

    const uploader = new Uploader(await this.project.profile.getRequester());

    return [
      <Promise<IBundleData>>combineLatest(this.bundled, this.metadata)
        .pipe(
          switchMap(async ([bundled, metadata]) => {
            await uploader.upload(bundled.location, metadata);
            return { tarball: bundled.location, readme: bundled.readme, metadata };
          }),
          merge(
            this.state.pipe(
              filter(s => s === WebpackState.Failed),
              switchMap(async () => {
                throw new WebpackBundlerError();
              }),
            ),
          ),
          take(1),
        )
        .toPromise(),
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
        this.bundled.next(notification);
        break;
      case NotificationType.BundleFailed:
        this.state.next(WebpackState.Failed);
        break;
      default:
      // ignored
    }
  }
}
