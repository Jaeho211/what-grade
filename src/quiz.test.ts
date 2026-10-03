import { generateQuestion } from './question-generator';
import { describe, expect, it } from 'vitest';
import { nextQuestion, questions, result, targetGrade, TOTAL, type Response } from './quiz';

function run(mode: 'correct' | 'wrong' | 'skip' | 'mixed') {
  const responses: Response[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const question = nextQuestion(responses, () => 0)!;
    const selected = mode === 'skip' ? null : mode === 'correct' || (mode === 'mixed' && i % 2 === 0) ? question.answer : (question.answer + 1) % question.choices.length;
    responses.push({ question, selected });
  }
  return responses;
}

describe('question bank', () => {
  it('has valid unique questions and distinct choices', () => {
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
    for (const q of questions) {
      expect(q.grade).toBeGreaterThanOrEqual(1);
      expect(q.grade).toBeLessThanOrEqual(q.schoolLevel === 'middle' ? 3 : 6);
      expect(q.choices[q.answer]).toBeDefined();
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });
});
describe('adaptive quiz', () => {
  it.each(['correct', 'wrong', 'skip', 'mixed'] as const)('completes ten distinct questions for %s responses', mode => {
    const responses = run(mode);
    expect(new Set(responses.map(r => r.question.id)).size).toBe(TOTAL);
    expect(new Set(responses.map(r => r.question.prompt)).size).toBe(TOTAL);
    expect(nextQuestion(responses)).toBeUndefined();
    const summary = result(responses);
    expect(summary.low).toBeGreaterThanOrEqual(1);
    expect(summary.high).toBeLessThanOrEqual(9);
  });
  it('keeps the level after one answer and raises after two correct answers', () => {
    const responses = run('correct');
    expect(targetGrade(responses.slice(0, 1))).toBe(5);
    expect(targetGrade(responses.slice(0, 2))).toBe(6);
    expect(result(responses).score).toBe(10);
    expect(targetGrade(responses)).toBe(9);
    expect(result(responses).supported).toBe(true);
  });
  it('checks a different concept within each pair and preserves the answer when shuffling', () => {
    const responses = run('correct');
    for (let i = 0; i < TOTAL; i += 2) {
      expect(responses[i].question.concept).not.toBe(responses[i + 1].question.concept);
    }
    for (const response of responses) {
      const original = generateQuestion(questions.find(q => q.id === response.question.id)!, () => 0);
      expect(response.question.concept).toBe(original.concept);
      expect(response.question.choices[response.question.answer]).toBeDefined();
    }
  });
  it('lowers for wrong or skipped answers and stays for mixed pairs', () => {
    expect(targetGrade(run('wrong'))).toBe(1);
    expect(result(run('skip')).score).toBe(0);
    expect(targetGrade(run('mixed'))).toBe(5);
  });
});

describe('randomized math', () => {
  const value = (text: string): number => {
    const parts = text.split('/').map(Number);
    return parts.length === 2 ? parts[0] / parts[1] : parts[0];
  };
  it('generates varied numbers and exactly one mathematically correct choice for every type', () => {
    let seed = 123456;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    for (const template of questions.filter(q => q.schoolLevel === 'elementary' && !q.id.startsWith('math-extra-'))) {
      const prompts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(template, random);
        prompts.add(q.prompt);
        const choices = q.choices.map(value);
        expect(new Set(choices.map(n => n.toFixed(10))).size).toBe(4);
        if (q.concept === '약수') {
          const n = Number(q.prompt.match(/^\d+/)![0]);
          expect(choices.filter(c => n % c === 0)).toEqual([choices[q.answer]]);
        } else {
          const [, left, op, right] = q.prompt.match(/^([\d./]+) ([+−×÷]) ([\d./]+) = \?$/)!;
          const a = value(left), b = value(right);
          const expected = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
          expect(choices[q.answer]).toBeCloseTo(expected, 10);
          expect(choices.filter(c => Math.abs(c - expected) < 1e-9)).toHaveLength(1);
        }
        expect(q.explanation).toContain(q.choices[q.answer]);
      }
      expect(prompts.size).toBeGreaterThan(10);
    }
  });
  it('preserves the calculated answer after choice shuffling', () => {
    for (const draw of [0, 0.25, 0.75, 0.999999]) {
      const q = nextQuestion([], () => draw)!;
      const [, a, b] = q.prompt.match(/^(\d+\.\d+) × (\d+) = \?$/) ?? [];
      if (q.concept === '소수의 곱셈') expect(Number(q.choices[q.answer])).toBeCloseTo(Number(a) * Number(b));
      else if (q.concept === '약수') {
        const n = Number(q.prompt.match(/^\d+/)![0]);
        expect(n % Number(q.choices[q.answer])).toBe(0);
      }
    }
  });
});

describe('fraction answer formatting', () => {
  const division = questions.find(q => q.concept === '분수의 나눗셈')!;
  const addition = questions.find(q => q.concept === '분수의 덧셈')!;
  function withDraws(template: typeof division, draws: number[]) {
    let i = 0;
    return generateQuestion(template, () => draws[i++]);
  }
  it('shows the reduced division answer and its reduction in the explanation', () => {
    const q = withDraws(division, [0, 0.75, 0]);
    expect(q.prompt).toBe('2/3 ÷ 2 = ?');
    expect(q.choices[q.answer]).toBe('1/3');
    expect(q.explanation).toContain('2/6');
    expect(q.explanation).toContain('약분하면 1/3');
  });
  it('formats whole-number choices as integers', () => {
    const q = withDraws(division, [0, 0.75, 0.3]);
    expect(q.choices).toContain('2');
    expect(q.choices).not.toContain('2/1');
  });
  it('keeps the common denominator for grade-four addition', () => {
    const q = withDraws(addition, [0.07, 0.3, 0.4]);
    expect(q.prompt).toBe('2/6 + 2/6 = ?');
    expect(q.choices[q.answer]).toBe('4/6');
  });
  it('has four distinct reduced choices and one correct answer for all division operands', () => {
    const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
    for (let d = 3; d <= 15; d++) for (let a = 1; a < d; a++) for (let b = 2; b <= 5; b++) {
      const q = withDraws(division, [(d - 3 + 0.1) / 13, (a - 1 + 0.1) / (d - 1), (b - 2 + 0.1) / 4]);
      expect(q.prompt).toBe(`${a}/${d} ÷ ${b} = ?`);
      expect(new Set(q.choices).size).toBe(4);
      const values = q.choices.map(text => {
        const [n, denominator = 1] = text.split('/').map(Number);
        expect(gcd(n, denominator)).toBe(1);
        if (denominator === 1) expect(text).not.toContain('/');
        return n / denominator;
      });
      expect(values.filter(n => Math.abs(n - a / (d * b)) < 1e-10)).toHaveLength(1);
      expect(values[q.answer]).toBeCloseTo(a / (d * b), 10);
    }
  });
});


describe('skipped responses', () => {
  it('records skips separately, completes the quiz, and uses unanswered level evidence', () => {
    const responses = run('skip').map(r => ({ ...r, skipped: true, timedOut: false }));
    expect(result(responses).skips).toBe(TOTAL);
    expect(result(responses).timeouts).toBe(0);
    expect(result(responses).score).toBe(0);
    expect(targetGrade(responses)).toBe(1);
    expect(nextQuestion(responses)).toBeUndefined();
  });
});
