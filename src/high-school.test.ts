import { describe, expect, it } from 'vitest';
import { generateQuestion } from './question-generator';
import { questions, nextQuestion, result, type Response } from './quiz';

describe('high-one question bank', () => {
  it('generates varied, independently verified answers for all eight concepts', () => {
    let seed = 310;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const templates = questions.filter(q => q.schoolLevel === 'high');
    expect(new Set(templates.map(q => q.concept)).size).toBe(8);
    for (const template of templates) {
      const prompts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(template, random);
        prompts.add(q.prompt);
        const n = (q.prompt.match(/\d+/g) ?? []).map(Number);
        let expected: number;
        switch (q.concept) {
          case '나머지정리': expected = n[0] * n[3] ** 2 + n[1] * n[3] + n[2]; break;
          case '판별식': expected = n[1] ** 2 / (4 * n[0]); break;
          case '복소수의 계산': expected = n[1] * n[2] + 1; break;
          case '조합': expected = n[0] * (n[0] - 1) / 2; break;
          case '집합의 원소 수': expected = n[0] + n[1] - n[2]; break;
          case '합성함수': expected = n[0] * n[2] ** 2 + n[1]; break;
          case '역함수': expected = (n[2] - n[1]) / n[0]; break;
          case '원의 방정식': expected = Math.sqrt(n[2]); break;
          default: throw Error(q.concept);
        }
        expect(Number(q.choices[q.answer])).toBe(expected);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.grade).toBe(1);
        expect(q.level).toBe(10);
        expect(q.explanation).toContain(q.choices[q.answer]);
      }
      expect(prompts.size).toBeGreaterThan(10);
    }
  });
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
