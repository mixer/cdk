import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import nodeFetch, { RequestInit, Response } from 'node-fetch';

import { SubprocessError } from './errors';

/**
 * Promisified fs.readFile
 */
export async function readFile(file: string): Promise<string> {
  return promiseCallback<string>(callback => fs.readFile(file, 'utf8', callback));
}

/**
 * Promisified fs.writeFile
 */
export async function writeFile(file: string, contents: string | Buffer): Promise<void> {
  return promiseCallback(callback => fs.writeFile(file, contents, callback));
}

/**
 * Promisified fs.appendFile
 */
export async function appendFile(file: string, contents: string | Buffer): Promise<void> {
  return promiseCallback(callback => fs.appendFile(file, contents, callback));
}

/**
 * Promisified fs.mkdir
 */
export async function mkdir(file: string, mode?: number): Promise<void> {
  return promiseCallback(callback => fs.mkdir(file, mode, callback));
}

/**
 * Copies a file from one place to another.
 */
export async function copy(source: string, destination: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fs
      .createReadStream(source)
      .pipe(fs.createWriteStream(destination))
      .on('error', reject)
      .on('close', resolve);
  });
}

/**
 * Promisified fs.exists
 */
export async function exists(file: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    fs.exists(file, resolve);
  });
}

/**
 * Promisified fs.readDir
 */
export async function readDir(dir: string): Promise<string[]> {
  return promiseCallback<string[]>(callback => fs.readdir(dir, callback));
}

/**
 * Takes a function that wants a callback, and resolves when that callback
 * is resolved upon or errored.
 */
export async function promiseCallback<R = any>(
  fn: (callback: (err?: Error | null, result?: R) => void) => void,
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    fn((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Waits for the child process to exit. Buffers output and throws it on a
 * non-zero exit code.
 */
export async function awaitChildProcess(child: ChildProcess) {
  const stdAll: (string | Buffer)[] = [];
  child.stdout.on('data', data => {
    stdAll.push(data);
  });
  child.stderr.on('data', data => {
    stdAll.push(data);
  });

  await new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }

      const output = Buffer.concat(stdAll.map(s => (typeof s === 'string' ? Buffer.from(s) : s)));
      reject(new SubprocessError(output.toString('utf8')));
    });
  });
}

/**
 * Returns a promise that resolves after the given duration.
 */
export async function delay(duration: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, duration)); // tslint:disable-line
}

/**
 * Returns a promise that never resolves.
 */
export async function never(): Promise<never> {
  return new Promise<never>(() => {}); // tslint:disable-line
}

/**
 * Wraps the error message, preserving its original stacktrace and adding
 * extra information.
 */
export function wrapErr(err: Error, message: string): Error {
  err.message = `${message}: ${err.message}`;
  return err;
}

/**
 * IFetchPolicy defines an interface that can augment a fetcher.
 */
export interface IFetchPolicy {
  /**
   * Returns one or more headers to add to outgoing requests.
   */
  header(): { [key: string]: string };
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch';

/**
 * IRequester is an interface for a type that makes fetch requests.
 */
export interface IRequester {
  with(...policies: IFetchPolicy[]): IRequester;
  json(method: HttpMethod, path: string, body?: object): Promise<Response>;
  run(path: string, init?: RequestInit): Promise<Response>;
}

/**
 * Returns a path to the Mixer API.
 */
export function api(): string {
  return process.env.MIIX_API || 'https://mixer.com';
}

/**
 * Fetcher is a concrete, node-fetch-based implementation of IRequester.
 */
export class Fetcher implements IRequester {
  constructor(
    private readonly policies: IFetchPolicy[] = [],
    private readonly host: string = `${api()}/api/v1`,
    private readonly fetch: typeof nodeFetch = nodeFetch,
  ) {}

  /**
   * Returns a new fetcher with the provided policies applied.
   */
  public with(...policies: IFetchPolicy[]): IRequester {
    return new Fetcher(this.policies.concat(policies), this.host, this.fetch);
  }

  /**
   * Makes a request with a JSON body to the give path.
   */
  public async json(method: HttpMethod, path: string, body?: object): Promise<Response> {
    return this.run(path, {
      method: method.toUpperCase(),
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a generic HTTP request to the given path.
   */
  public async run(path: string, init: RequestInit = {}): Promise<Response> {
    init.headers = init.headers || {};
    if (process.env.MIIX_HEADERS) {
      Object.assign(init.headers, JSON.parse(process.env.MIIX_HEADERS!));
    }

    this.policies.forEach(p => Object.assign(init.headers, p.header()));

    return this.fetch(`${this.host}${path}`, init);
  }
}
