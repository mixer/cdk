import { UnexpectedHttpError } from './errors';
import { Fetcher } from './util';

/**
 * IIssueHandle references metadata about an issue created in the tracker.
 */
export interface IIssueHandle {
  id: string;
  password: string;
}

/**
 * IssueTracker stores metadata about issues remotely.
 */
export class IssueTracker {
  constructor(
    private readonly fetcher = new Fetcher([], 'https://cdk-issues.azurewebsites.net/api'),
  ) {}

  /**
   * Saves data remotely
   */
  public async save(data: any): Promise<IIssueHandle> {
    const res = await this.fetcher.json('put', '/issues', { data });
    if (res.status !== 200) {
      throw new UnexpectedHttpError(res, await res.text());
    }

    return await res.json();
  }
}
