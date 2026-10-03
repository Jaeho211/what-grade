import { describe, expect, it } from 'vitest';
import { nextQuestion, result, TOTAL, type Response } from './quiz';

describe('middle school extension', () => {
  it('covers all ten result levels across all 1024 correct/wrong paths in ten questions', () => {
    const levels = new Set<number>();
    for (let mask = 0; mask < 1024; mask++) {
      const responses: Response[] = [];
      for (let i = 0; i < TOTAL; i++) {
        const q = nextQuestion(responses, () => 0)!;
        if (i % 2 === 1 && i < 7) {
          expect(q.level).toBe(responses[i - 1].question.level);
          expect(q.concept).not.toBe(responses[i - 1].question.concept);
        }
        responses.push({ question: q, selected: mask & (1 << i) ? q.answer : (q.answer + 1) % 4 });
      }
      const summary = result(responses);
      levels.add(summary.grade);
      expect(summary.grade).toBeGreaterThanOrEqual(1);
      expect(summary.grade).toBeLessThanOrEqual(10);
      expect(nextQuestion(responses)).toBeUndefined();
      expect(new Set(responses.map(r => r.question.prompt)).size).toBe(10);
      if (mask === 1023) {
        expect(responses.map(r => r.question.level)).toEqual([5, 5, 6, 6, 7, 7, 9, 10, 10, 10]);
        expect(summary.supported).toBe(true);
      }
      if (mask === 0) expect(responses.map(r => r.question.level)).toEqual([5, 5, 4, 4, 3, 3, 2, 2, 1, 1]);
    }
    expect(levels.has(1)).toBe(true);
    expect(levels.has(9)).toBe(true);
    expect(levels.has(10)).toBe(true);
  });
});
