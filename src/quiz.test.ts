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
      const original = questions.find(q => q.id === response.question.id)!;
      expect(response.question.choices[response.question.answer]).toBe(original.choices[original.answer]);
    }
  });
  it('lowers for wrong or skipped answers and stays for mixed pairs', () => {
    expect(targetGrade(run('wrong'))).toBe(1);
    expect(result(run('skip')).score).toBe(0);
    expect(targetGrade(run('mixed'))).toBe(3);
  });
});
