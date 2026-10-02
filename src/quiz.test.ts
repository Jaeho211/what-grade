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
      expect(q.grade).toBeLessThanOrEqual(6);
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
    expect(summary.high).toBeLessThanOrEqual(6);
  });
  it('keeps the level after one answer and raises after two correct answers', () => {
    const responses = run('correct');
    expect(targetGrade(responses.slice(0, 1))).toBe(3);
    expect(targetGrade(responses.slice(0, 2))).toBe(4);
    expect(result(responses).score).toBe(10);
    expect(targetGrade(responses)).toBe(6);
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
    expect(targetGrade(run('mixed'))).toBe(3);
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
    for (const template of questions) {
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
      const [, a, b] = q.prompt.match(/^(\d+) [+÷] (\d+) = \?$/)!;
      const expected = q.concept === '나눗셈' ? Number(a) / Number(b) : Number(a) + Number(b);
      expect(Number(q.choices[q.answer])).toBe(expected);
    }
  });
});
