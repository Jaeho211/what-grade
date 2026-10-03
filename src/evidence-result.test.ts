import { describe, expect, it } from 'vitest';
import { nextQuestion, questions, result, targetGrade, type Response } from './quiz';

function answer(concept: string, level: number, right = true): Response {
  const question = questions.find(q => q.concept === concept && q.level === level)!;
  return { question, selected: right ? question.answer : (question.answer + 1) % 4, elapsedMs: 6000 };
}
const high = () => [answer('판별식', 10), answer('합성함수', 10), answer('원의 방정식', 10)];

describe('whole-quiz evidence', () => {
  it('keeps final grade independent of order, speed, and exploration target', () => {
    const responses = [...high(), ...Array.from({ length: 7 }, () => answer('약수', 5, false))];
    expect(targetGrade(responses)).toBeLessThan(10);
    expect(result(responses).grade).toBe(10);
    expect(result([...responses].reverse()).grade).toBe(10);
    expect(result(responses.map(r => ({ ...r, elapsedMs: 19000 }))).grade).toBe(10);
  });
  it('distinguishes three out of three, four, and five advanced attempts', () => {
    expect(result(high()).grade).toBe(10);
    expect(result([...high(), answer('조합', 10, false)]).grade).toBe(10);
    expect(result([...high(), answer('조합', 10, false), answer('역함수', 10, false)]).grade).toBeLessThan(10);
  });
  it('preserves established middle-three evidence after harder failures', () => {
    const middle = [answer('근호의 계산', 9), answer('이차함수의 꼭짓점', 9), answer('삼각비로 길이 구하기', 9)];
    expect(result([...middle, ...high().map(r => ({ ...r, selected: null, timedOut: true }))]).grade).toBe(9);
  });
  it('returns a tentative lower label without automatically assigning grade one', () => {
    const partial = [answer('약수', 5), answer('직사각형의 넓이', 5)];
    expect(result(partial).grade).toBe(5);
    expect(result(partial).supported).toBe(false);
    const failed = result([answer('약수', 5, false), answer('평균', 5, false)]);
    expect(failed.grade).toBe(4);
    expect(failed.supported).toBe(false);
  });
  it('prioritizes a domain without a successful answer even after previous attempts', () => {
    const responses = [answer('직사각형의 넓이', 5, false), answer('약수', 5),
      answer('직사각형의 넓이', 5, false), answer('평균', 5)];
    expect(nextQuestion(responses, () => 0)!.domain).toBe('도형');
  });
  it('uses remaining questions to confirm middle three after two high-one misses', () => {
    const responses: Response[] = [];
    for (let i = 0; i < 9; i++) {
      const question = nextQuestion(responses, () => 0)!;
      responses.push({ question, selected: i < 7 ? question.answer : null, timedOut: i >= 7 });
    }
    expect(nextQuestion(responses, () => 0)!.level).toBe(9);
  });
});
