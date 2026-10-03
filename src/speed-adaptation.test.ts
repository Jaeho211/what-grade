import { describe, expect, it } from 'vitest';
import { nextQuestion, targetGrade, result, type Response } from './quiz';

function play(times: (number | undefined)[], miss = -1) {
  const responses: Response[] = [];
  for (const [i, elapsedMs] of times.entries()) {
    const question = nextQuestion(responses, () => 0)!;
    responses.push({ question, selected: i === miss ? (question.answer + 1) % 4 : question.answer, elapsedMs });
  }
  return responses;
}

describe('speed-assisted exploration', () => {
  it('raises two levels for a fast pair and one for a normal pair', () => {
    expect(targetGrade(play([5000]))).toBe(5);
    expect(targetGrade(play([5000, 5000]))).toBe(7);
    expect(targetGrade(play([5000, 5001]))).toBe(6);
    expect(targetGrade(play([19000, 19000]))).toBe(6);
  });
  it('requires reliable timing and two correct answers', () => {
    for (const times of [[999, 5000], [undefined, 5000], [NaN, 5000], [Infinity, 5000]]) {
      expect(targetGrade(play(times))).toBe(6);
    }
    expect(targetGrade(play([2000, 2000], 0))).toBe(5);
    const invalid = play([2000, 2000]);
    invalid[0].timedOut = true;
    expect(targetGrade(invalid)).toBe(6);
    invalid[0].timedOut = false;
    invalid[0].skipped = true;
    expect(targetGrade(invalid)).toBe(6);
  });
  it('uses the expected time of each question and keeps the advanced checkpoint', () => {
    const responses = play(Array(10).fill(5000));
    expect(responses.map(r => r.question.level)).toEqual([5, 5, 7, 7, 9, 9, 10, 10, 10, 10]);
    expect(new Set(responses.slice(7).map(r => r.question.domain)).size).toBe(3);
    expect(result(responses).grade).toBe(10);
    const boundary = play([5000, 5000, 8500, 8500]);
    expect(targetGrade(boundary)).toBe(9);
    boundary[3].elapsedMs = 8501;
    expect(targetGrade(boundary)).toBe(8);
    expect(result(responses.slice(0, 4)).grade).toBeLessThan(9);
    const noHigh = responses.map(r => r.question.level === 10 ? { ...r, selected: null } : r);
    expect(result(noHigh).grade).toBeLessThan(10);
  });
  it('does not stack speed and recovery into a three-level jump', () => {
    const responses = play(Array(6).fill(2000), 0);
    expect(targetGrade(responses)).toBe(9);
  });
});
