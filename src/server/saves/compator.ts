/**
 * ISaveCompact contains logic for trimming the number of save files.
 */
export interface ISaveCompactor {
  /**
   * Trim takes a data mapping of dates to items, and returns the items
   * which should be *removed*. Assumes data is sorted in ascending
   * order by date.
   */
  trim<T>(data: [Date, T][], now: number): T[];
}

/**
 * Options passed to the IExponentialSaveCompactorOptions. It defines
 * buckets, in which at most one save will be retained.
 */
export interface IExponentialSaveCompactorOptions {
  /**
   * The length of the base bucket.
   */
  baseBucketMs: number;

  /**
   * How much to increase the bucket size at each step. For instance, if
   * the baseBucketMs is 10000 and the multiplier is 2, the buckets
   * will be 10s, 20s, 40s, and so on.
   */
  bucketIncreaseMultiplier: number;

  /**
   * Maximum bucket size.
   */
  bucketMaxMs: number;

  /**
   * Maximum amount of time to keep save files for.
   */
  maxRetentionMs: number;
}

/**
 * ExponentialSaveCompactor stores saves in backed-off buckets, so older
 * saves are kept with lesser granularity.
 */
export class ExponentialSaveCompactor implements ISaveCompactor {
  constructor(private readonly options: IExponentialSaveCompactorOptions) {}

  public trim<T>(data: [Date, T][], now: number): T[] {
    const toRemove: T[] = [];
    const maxCutoff = now - this.options.maxRetentionMs;
    let currentCutoff = now;
    let lastBucket = this.options.baseBucketMs;

    for (let i = data.length - 1; i >= 0; i--) {
      const time = data[i][0].getTime();
      if (time > currentCutoff || time < maxCutoff) {
        toRemove.push(data[i][1]);
        continue;
      }

      while (time <= currentCutoff) {
        currentCutoff -= lastBucket;
        lastBucket = Math.min(
          lastBucket * this.options.bucketIncreaseMultiplier,
          this.options.bucketMaxMs,
        );
      }
    }

    return toRemove;
  }
}
