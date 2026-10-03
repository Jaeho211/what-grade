import { describe, expect, it } from 'vitest';
import { nextQuestion, result, streakStats, type Response } from './quiz';
import { createRoundClock } from './round-clock';

describe('answer feedback', () => {
  function responsesFor(pattern: string) {
    const responses: Response[] = [];
    for (const mark of pattern) {
      const question = nextQuestion(responses, () => 0)!;
      responses.push({ question, selected: mark === 'Y' ? question.answer : mark === 'T' ? null : (question.answer + 1) % 4, timedOut: mark === 'T' });
    }
    return responses;
  }
  it('tracks the longest streak and resets the current streak on wrong answers and timeouts', () => {
    expect(streakStats(responsesFor('YYYNY'))).toEqual({ current: 1, best: 3 });
    expect(streakStats(responsesFor('YYYTY'))).toEqual({ current: 1, best: 3 });
    expect(result(responsesFor('YYNYYYYNYY')).bestStreak).toBe(4);
    expect(streakStats([])).toEqual({ current: 0, best: 0 });
  });
  it('freezes remaining time and ignores repeat submission during feedback', () => {
    const clock = createRoundClock(0);
    expect(clock.settle(2, 6000)?.elapsedMs).toBe(6000);
    expect(clock.remaining(6400)).toBe(14);
    expect(clock.remaining(30000)).toBe(14);
    expect(clock.settle(null, 20000)).toBeUndefined();
    const next = createRoundClock(6400);
    expect(next.remaining(6400)).toBe(20);
    expect(next.settle(1, 7000)?.elapsedMs).toBe(600);
  });
  it('keeps a timeout at zero during the transition', () => {
    const clock = createRoundClock(0);
    expect(clock.settle(0, 20000)?.timedOut).toBe(true);
    expect(clock.remaining(20800)).toBe(0);
  });
});
