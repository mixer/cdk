import { expect } from 'chai';
import { ExponentialSaveCompactor } from '../src/server/saves/compator';

describe('ExponentialSaveCompactor', () => {
  let compactor: ExponentialSaveCompactor;
  beforeEach(() => {
    compactor = new ExponentialSaveCompactor({
      baseBucketMs: 10,
      bucketIncreaseMultiplier: 2,
      bucketMaxMs: 50,
      maxRetentionMs: 150,
    });
  });

  it('does not error on empty array', () => {
    expect(compactor.trim([], Date.now())).to.deep.equal([]);
  });

  it('appears to work otherwise', () => {
    // should cut into 0-10ms, 10-30ms, 30-70ms, 70-120ms, 120-150ms and then cut off
    const now = Date.now();
    const data: [Date, string][] = [];
    for (let i = 200; i >= 0; i -= 15) {
      data.push([new Date(now - i), `${i}ms ago`]);
    }

    expect(compactor.trim(data, now)).to.deep.equal([
      // 5ms ago slots into 0-10ms bucket
      // 20ms ago slots into 20-30ms bucket
      // 35ms ago slots into 30-70ms bucket
      `50ms ago`,
      `65ms ago`,
      // 80ms ago slots into 70-120ms bucket
      `95ms ago`,
      `110ms ago`,
      // 125ms ago slots into 120-1250ms bucket
      `140ms ago`,
      `155ms ago`,
      `170ms ago`,
      `185ms ago`,
      `200ms ago`,
    ]);
  });
});
