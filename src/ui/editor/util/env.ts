import { IDevEnvironment } from '../../typings';

export const dev: IDevEnvironment = (<any>window).miixDev;

/**
 * Returns a path on the local API dev server.
 */
export function apiUrl(path: string) {
  if (path[0] === '/') {
    path = path.slice(1);
  }

  // tslint:disable-next-line
  return `http://${dev.devServerAddress}/${path}`;
}

export function mixerUrl() {
  return dev.mixerAddress;
}
