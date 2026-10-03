import { describe, expect, it } from 'vitest';
import { generateQuestion } from './question-generator';
import { questions, result, nextQuestion, type Response } from './quiz';

const response = (concept: string, level: number, elapsedMs = 6000): Response => {
  const q = questions.find(q => q.concept === concept && q.level === level)!;
  return { question: q, selected: q.answer, elapsedMs };
};
describe('balanced evidence and timing', () => {
  it('does not infer middle three from Pythagoras alone or fast answers in one domain', () => {
    const only = Array.from({ length: 10 }, () => response('피타고라스 정리', 8, 2000));
    expect(result(only).supported).toBe(false);
    expect(result(only).label).toBe('초등 1학년');
  });
  it('does not award an untested grade and uses time only for confidence', () => {
    const evidence = [response('약수', 5), response('직사각형의 넓이', 5), response('평균', 5)];
    const fast = result(evidence);
    const slow = result(evidence.map(r => ({ ...r, elapsedMs: 19000 })));
    expect(fast.supported).toBe(true);
    expect(fast.grade).toBe(5);
    expect(slow.grade).toBe(fast.grade);
    expect(fast.confidence).not.toBe(slow.confidence);
    expect(result(evidence.map(r => ({ ...r, elapsedMs: 100 }))).confidence).toBe('잠정 결과');
  });
  it('selects another domain before repeating one at the same grade', () => {
    const first = nextQuestion([], () => 0)!;
    const second = nextQuestion([{ question: first, selected: first.answer }], () => 0)!;
    expect(second.level).toBe(first.level);
    expect(second.domain).not.toBe(first.domain);
  });
  it('has at least three domains at every grade', () => {
    for (let level = 1; level <= 9; level++) {
      expect(new Set(questions.filter(q => q.level === level).map(q => q.domain)).size).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('new problem generators', () => {
  it('calculates the new numerical and fraction types with unique choices', () => {
    let seed = 42;
    const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const old = ['정수의 덧셈', '일차방정식', '정비례', '지수법칙', '연립일차방정식', '피타고라스 정리', '제곱근', '이차방정식', '이차함수'];
    for (const template of questions.filter(q => q.id.startsWith('math-extra-') && !old.includes(q.concept))) {
      for (let i = 0; i < 50; i++) {
        const q = generateQuestion(template, rng);
        const n = (q.prompt.match(/-?\d+/g) ?? []).map(Number);
        let expected: number;
        switch (q.concept) {
          case '모양 찾기': {
            expect(q.choices[q.answer]).toBe(n[0] === 3 ? '삼각형' : '사각형');
            expect(new Set(q.choices).size).toBe(4); continue;
          }
          case '수의 순서': expected = n[0] + 1; break;
          case '길이 단위': expected = n[0] * 100 + n[1]; break;
          case '수의 규칙': expected = n[2] + n[1] - n[0]; break;
          case '시간 계산': {
            const minutes = n[1] + n[2];
            expect(q.choices[q.answer]).toBe(`${n[0] + Math.floor(minutes / 60)}시 ${minutes % 60}분`);
            expect(new Set(q.choices).size).toBe(4); continue;
          }
          case '정사각형의 변': expected = n[0]; break;
          case '각도 계산': expected = 180 - n[0]; break;
          case '직사각형의 넓이': expected = n[0] * n[1]; break;
          case '평균': expected = (n[0] + n[1] + n[2]) / 3; break;
          case '직육면체의 부피': expected = n[0] * n[1] * n[2]; break;
          case '백분율': expected = n[0] * n[1] / 100; break;
          case '삼각형의 내각': expected = 180 - n[0] - n[1]; break;
          case '중앙값': expected = [...n].sort((a,b) => a-b)[1]; break;
          case '일차함수의 기울기': expected = n[0]; break;
          case '확률': expected = n[0] / (n[0] + n[1]); break;
          case '인수분해': expected = n[0] / 2; break;
          case '삼각비': expected = n[0] / n[1]; break;
          case '분산': expected = ((n[1] - n[0]) / 2) ** 2; break;
          default: throw Error(q.concept);
        }
        const values = q.choices.map(s => { const [a,b=1] = s.split('/').map(Number); return a/b; });
        expect(values[q.answer]).toBeCloseTo(expected);
        expect(values.filter(v => Math.abs(v-expected) < 1e-9)).toHaveLength(1);
        expect(new Set(q.choices).size).toBe(4);
      }
    }
  });
});


describe('game result label', () => {
  it('always returns a single grade for correct, wrong, skipped, and timeout responses', () => {
    for (const mode of ['correct', 'wrong', 'skip', 'timeout']) {
      const responses: Response[] = [];
      for (let i = 0; i < 10; i++) {
        const q = nextQuestion(responses, () => 0)!;
        responses.push({ question: q, selected: mode === 'correct' ? q.answer : mode === 'wrong' ? (q.answer + 1) % 4 : null, skipped: mode === 'skip', timedOut: mode === 'timeout' });
      }
      expect(result(responses).label).toMatch(/^(초등 [1-6]학년|중학교 [1-3]학년)$/);
    }
  });
});
