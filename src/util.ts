import nodeFetch, { RequestInit, Response } from 'node-fetch';

/**
 * Returns a promise that resolves after the given duration.
 */
export async function delay(duration: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, duration)); // tslint:disable-line
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
  json(method: HttpMethod, path: string, body?: object): Promise<Response>;
}

/**
 * Fetcher is a concrete, node-fetch-based implementation of IRequester.
 */
export class Fetcher implements IRequester {
  constructor(
    private readonly policies: IFetchPolicy[] = [],
    private readonly host: string = 'https://mixer.com/api/v1',
    private readonly fetch: typeof nodeFetch = nodeFetch,
  ) {}

  /**
   * Returns a new fetcher with the provided policies applied.
   */
  public with(...policies: IFetchPolicy[]): Fetcher {
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
    this.policies.forEach(p => {
      init.headers = Object.assign(init.headers || {}, p.header());
    });

    return this.fetch(`${this.host}${path}`, init);
  }
}
