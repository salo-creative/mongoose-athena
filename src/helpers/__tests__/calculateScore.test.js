import { calculateScore } from '../index';

describe('Calculate score', () => {
  it('should give higher scores for better matches', () => {
    const items = ['This', 'is', 'a', 'sentence'];
    const goodMatch = calculateScore({ items, term: 'This is a sentence' });
    const closeMatch = calculateScore({ items, term: 'This is not a sentence' });
    const badMatch = calculateScore({ items, term: 'Thxs es a sxntxcx' });
    const worstMatch = calculateScore({ items, term: '1234' });

    expect(goodMatch).toBeGreaterThan(badMatch);
    expect(goodMatch).toBeGreaterThan(closeMatch);
    expect(closeMatch).toBeGreaterThan(badMatch);
    expect(goodMatch).toBeGreaterThan(worstMatch);
    expect(badMatch).toBeGreaterThan(worstMatch);
    expect(worstMatch).toBe(0);
  });
  
  it('should give a score of 0 for terrible matches', () => {
    const items = ['This', 'is', 'a', 'sentence'];
    const match = calculateScore({ items, term: '1234' });

    expect(match).toBe(0);
  });
  
  it('should only count scores over the threshold', () => {
    const items = ['This', 'is', 'a', 'sentence'];
    const bestMatch = calculateScore({ items, term: 'this', threshold: 1 });
    const goodMatch = calculateScore({ items, term: 'sentence', threshold: 1 });

    expect(bestMatch).toBeGreaterThan(goodMatch);
  });

  it('should weigh some fields higher than others', () => {
    const items = ['This', 'is', 'a', 'sentence'];
    const heavy = calculateScore({
      items,
      term: 'this',
      threshold: 1,
      weight: 5
    });
    const light = calculateScore({
      items,
      term: 'this',
      threshold: 1,
      weight: 0.5
    });

    expect(heavy).toBeGreaterThan(light);
  });
});