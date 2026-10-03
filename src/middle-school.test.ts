import { describe, expect, it } from 'vitest';
import { generateQuestion } from './question-generator';
import { questions, nextQuestion, result, TOTAL, type Response } from './quiz';

describe('middle school extension', () => {
  it('calculates one correct answer for randomized questions in all nine middle-school concepts', () => {
    let seed = 2026;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    for (const template of questions.filter(q => q.schoolLevel === 'middle' && ['정수의 덧셈', '일차방정식', '정비례', '지수법칙', '연립일차방정식', '피타고라스 정리', '제곱근', '이차방정식', '이차함수'].includes(q.concept))) {
      const prompts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(template, random);
        prompts.add(q.prompt);
        const numbers = q.prompt.match(/−?\-?\d+/g)!.map(n => Number(n.replace('−', '-')));
        let expected: number;
        switch (q.concept) {
          case '정수의 덧셈': expected = numbers[0] + numbers[1]; break;
          case '일차방정식': expected = (numbers[2] - numbers[1]) / numbers[0]; break;
          case '정비례': expected = numbers[0] * numbers[1]; break;
          case '지수법칙': expected = numbers[1] + numbers[3]; break;
          case '연립일차방정식': expected = (numbers[0] + numbers[1]) / 2; break;
          case '피타고라스 정리': expected = Math.hypot(numbers[0], numbers[1]); break;
          case '제곱근': expected = Math.sqrt(numbers[0]); break;
          case '이차방정식': expected = Math.sqrt(numbers[0]); break;
          case '이차함수': expected = numbers[0] * numbers[1] ** 2; break;
          default: throw Error(q.concept);
        }
        const values = q.choices.map(Number);
        expect(values[q.answer]).toBeCloseTo(expected, 10);
        expect(values.filter(v => Math.abs(v - expected) < 1e-10)).toHaveLength(1);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.explanation).toContain(q.choices[q.answer]);
        expect(q.level).toBe(q.grade + 6);
      }
      expect(prompts.size).toBeGreaterThan(10);
    }
  });
  it('covers all nine results across all 1024 correct/wrong paths in ten questions', () => {
    const levels = new Set<number>();
    for (let mask = 0; mask < 1024; mask++) {
      const responses: Response[] = [];
      for (let i = 0; i < TOTAL; i++) {
        const q = nextQuestion(responses, () => 0)!;
        if (i % 2 === 1 && i !== 7) {
          expect(q.level).toBe(responses[i - 1].question.level);
          expect(q.concept).not.toBe(responses[i - 1].question.concept);
        }
        responses.push({ question: q, selected: mask & (1 << i) ? q.answer : (q.answer + 1) % 4 });
      }
      const summary = result(responses);
      levels.add(summary.grade);
      expect(summary.grade).toBeGreaterThanOrEqual(1);
      expect(summary.grade).toBeLessThanOrEqual(9);
      expect(nextQuestion(responses)).toBeUndefined();
      expect(new Set(responses.map(r => r.question.prompt)).size).toBe(10);
      if (mask === 1023) {
        expect(responses.map(r => r.question.level)).toEqual([5, 5, 6, 6, 7, 7, 8, 9, 9, 9]);
        expect(summary.supported).toBe(true);
      }
      if (mask === 0) expect(responses.map(r => r.question.level)).toEqual([5, 5, 4, 4, 3, 3, 2, 2, 1, 1]);
    }
    expect(levels.has(1)).toBe(true);
    expect(levels.has(9)).toBe(true);
  });
});
