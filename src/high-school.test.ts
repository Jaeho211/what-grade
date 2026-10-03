import { describe, expect, it } from 'vitest';
import { questions, nextQuestion, result, type Response } from './quiz';

describe('high-one question bank', () => {
  it('never awards high one from a single domain or fewer than three high answers', () => {
    const template = questions.find(q => q.concept === '판별식')!;
    const same = Array.from({ length: 10 }, () => ({ question: template, selected: template.answer }));
    expect(result(same).grade).toBeLessThan(10);
    for (const draw of [0, 0.25, 0.7, 0.99]) {
      const responses: Response[] = [];
      for (let i = 0; i < 10; i++) {
        const q = nextQuestion(responses, () => draw)!;
        responses.push({ question: q, selected: q.answer });
      }
      expect(result(responses).label).toBe('고등학교 1학년');
      expect(new Set(responses.slice(7).map(r => r.question.domain)).size).toBe(3);
      for (let miss = 7; miss < 10; miss++) {
        expect(result(responses.map((r, i) => i === miss ? { ...r, selected: null } : r)).grade).toBeLessThan(10);
      }
    }
  });
});
