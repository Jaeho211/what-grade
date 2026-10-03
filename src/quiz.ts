import { generateQuestion } from './question-generator';
import grade1 from '../data/questions/math/grade-1.json';
import grade2 from '../data/questions/math/grade-2.json';
import grade3 from '../data/questions/math/grade-3.json';
import grade4 from '../data/questions/math/grade-4.json';
import grade5 from '../data/questions/math/grade-5.json';
import grade6 from '../data/questions/math/grade-6.json';

export type Question = {
  id: string; schoolLevel: 'elementary' | 'middle' | 'high'; grade: number; level: number; concept: string; domain?: string; expectedMs?: number; challenge?: boolean; prompt: string;
  choices: string[]; answer: number; explanation: string;
};
export type Response = { question: Question; selected: number | null; elapsedMs?: number; timedOut?: boolean; skipped?: boolean };
const elementary: Question[] = [...grade1, ...grade2, ...grade3, ...grade4, ...grade5, ...grade6]
  .map(q => ({ ...q, schoolLevel: 'elementary', level: q.grade }));
const addedConcepts: [number, string, string, number][] = [
  [1, '모양 찾기', '도형', 8000], [1, '수의 순서', '규칙과 관계', 7000],
  [2, '길이 단위', '측정', 9000], [2, '수의 규칙', '규칙과 관계', 10000],
  [3, '시간 계산', '측정', 12000], [3, '정사각형의 변', '도형', 8000],
  [4, '각도 계산', '도형', 10000], [4, '수의 규칙', '규칙과 관계', 10000],
  [5, '직사각형의 넓이', '도형', 10000], [5, '평균', '자료와 가능성', 13000],
  [6, '직육면체의 부피', '도형', 13000], [6, '백분율', '규칙과 관계', 12000],
  [7, '정수의 덧셈', '수와 연산', 8000], [7, '일차방정식', '문자와 식', 13000],
  [7, '정비례', '함수', 10000], [7, '삼각형의 내각', '도형', 10000], [7, '중앙값', '자료와 가능성', 12000],
  [8, '지수법칙', '문자와 식', 10000], [8, '연립일차방정식', '문자와 식', 15000],
  [8, '피타고라스 정리', '도형', 15000], [8, '일차함수의 기울기', '함수', 12000], [8, '확률', '자료와 가능성', 12000],
  [1, '수 비교', '수와 연산', 8000], [2, '두 자리 수의 뺄셈', '수와 연산', 10000],
  [3, '나눗셈의 나머지', '수와 연산', 12000], [4, '직사각형의 둘레', '도형', 12000],
  [5, '최대공약수', '수와 연산', 13000], [6, '비례식', '규칙과 관계', 13000],
  [7, '정수의 곱셈', '수와 연산', 10000], [7, '다각형의 내각의 합', '도형', 13000],
  [8, '일차부등식', '문자와 식', 14000], [8, '닮음비', '도형', 14000],
  [9, '제곱근', '수와 연산', 9000], [9, '이차방정식', '문자와 식', 12000],
  [9, '인수분해', '문자와 식', 15000], [9, '이차함수', '함수', 12000],
  [9, '삼각비', '도형', 15000], [9, '분산', '자료와 가능성', 15000],
];
const challengeConcepts: [number, string, string, number][] = [
  [9, '근호의 계산', '수와 연산', 15000], [9, '이차방정식의 두 근', '문자와 식', 17000],
  [9, '이차함수의 꼭짓점', '함수', 17000], [9, '삼각비로 길이 구하기', '도형', 17000],
  [9, '표준편차', '자료와 가능성', 17000],
];
const highConcepts: [number, string, string, number][] = [
  [10, '나머지정리', '문자와 식', 17000], [10, '판별식', '문자와 식', 17000],
  [10, '복소수의 계산', '문자와 식', 15000], [10, '조합', '자료와 가능성', 17000],
  [10, '집합의 원소 수', '자료와 가능성', 17000], [10, '합성함수', '함수', 17000],
  [10, '역함수', '함수', 17000], [10, '원의 방정식', '도형', 17000],
];
addedConcepts.push(...challengeConcepts, ...highConcepts);
const extra: Question[] = addedConcepts.flatMap(([level, concept, domain, expectedMs]) =>
  Array.from({ length: 4 }, (_, slot) => ({
    id: `math-extra-${level}-${concept}-${slot + 1}`, schoolLevel: level <= 6 ? 'elementary' as const : level <= 9 ? 'middle' as const : 'high' as const,
    grade: level <= 6 ? level : level <= 9 ? level - 6 : level - 9, level, concept, domain, expectedMs: level >= 7 ? 17000 : expectedMs,
    challenge: level === 10 || challengeConcepts.some(([, name]) => name === concept),
    prompt: '', choices: [], answer: 0, explanation: '',
  })));
// Concrete samples keep the exported bank usable for previews and validation.
export const questions: Question[] = [...elementary.map(q => ({ ...q, expectedMs: 10000 })), ...extra.map(q => generateQuestion(q, () => 0))];
export const START_LEVEL = 5;
export const MAX_LEVEL = 10;
export function levelLabel(level: number): string {
  return level <= 6 ? `초등 ${level}학년` : level <= 9 ? `중학교 ${level - 6}학년` : `고등학교 ${level - 9}학년`;
}
export const TOTAL = 10;
export const correct = (response: Response) => response.selected === response.question.answer;

// Pairs explore the level; a sustained recovery can earn one extra step.
export function targetGrade(responses: Response[]): number {
  let grade = START_LEVEL;
  let streak = 0, hadMiss = false, recoveryUsed = false;
  for (let i = 0; i < responses.length; i++) {
    if (correct(responses[i])) streak++;
    else { streak = 0; hadMiss = true; }
    if (i % 2 === 1) {
      const pair = responses.slice(i - 1, i + 1);
      if (pair.every(correct)) grade = Math.min(MAX_LEVEL, grade + 1);
      else if (pair.every(r => !correct(r))) grade = Math.max(1, grade - 1);
      if (hadMiss && !recoveryUsed && streak >= 3) {
        grade = Math.min(MAX_LEVEL, grade + 1);
        recoveryUsed = true;
      }
    }
  }
  // A strong opening earns a middle-three checkpoint before the high-school challenge.
  if (responses.length === 6 && responses.slice(-3).every(correct) && responses.at(-1)!.question.level >= 7) return 9;
  // Reserve three diverse challenges; an early recovery can still finish at middle three.
  // Past mistakes do not lock the player out; the advanced answers still decide the result.
  if (responses.length >= 7) {
    const opening = responses.slice(0, 7);
    const last = opening.at(-1)!;
    if (last.question.level >= 8 && correct(last) && opening.slice(-3).every(correct)) return last.question.level >= 9 ? MAX_LEVEL : 9;
  }
  return grade;
}

export function nextQuestion(responses: Response[], random = Math.random): Question | undefined {
  if (responses.length >= TOTAL) return undefined;
  const used = new Set(responses.map(r => r.question.id));
  const remaining = questions.filter(q => !used.has(q.id) && (q.level !== 9 || q.challenge));
  const target = targetGrade(responses);
  const distance = Math.min(...remaining.map(q => Math.abs(q.level - target)));
  const nearby = remaining.filter(q => Math.abs(q.level - target) === distance);
  // Balance domains at this level first, then concepts; template counts do not bias selection.
  const atLevel = responses.filter(r => r.question.level === target);
  const countDomain = (q: Question) => atLevel.filter(r => r.question.domain === q.domain).length;
  const least = Math.min(...nearby.map(countDomain));
  const balanced = nearby.filter(q => countDomain(q) === least);
  const differentConcept = balanced.filter(q => q.concept !== responses.at(-1)?.question.concept);
  const candidates = differentConcept.length ? differentConcept : balanced;
  const concepts = [...new Set(candidates.map(q => q.concept))];
  const concept = concepts[Math.min(concepts.length - 1, Math.floor(random() * concepts.length))];
  const pool = candidates.filter(q => q.concept === concept);
  const template = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  if (!template) return undefined;
  const usedPrompts = new Set(responses.map(r => r.question.prompt));
  let question = generateQuestion(template, random);
  // Bounded retries also work with a constant injected RNG in tests.
  for (let attempt = 1; usedPrompts.has(question.prompt) && attempt <= 100; attempt++) {
    let draw = 0;
    question = generateQuestion(template, () => (random() + attempt * 0.618033988749895 + draw++ * 0.414213562373095) % 1);
  }
  if (usedPrompts.has(question.prompt)) throw new Error('새 문제를 생성하지 못했습니다.');
  const order = question.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...question, choices: order.map(i => question.choices[i]), answer: order.indexOf(question.answer) };
}

export function streakStats(responses: Response[]) {
  let current = 0, best = 0;
  for (const response of responses) {
    current = correct(response) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

export function result(responses: Response[]) {
  const target = targetGrade(responses);
  // A single specialty cannot establish a grade. Evidence includes its adjacent prerequisite level.
  const qualified = (level: number) => {
    if (level >= 9) {
      const advanced = responses.filter(r => correct(r) && r.question.level >= level && r.question.challenge);
      return advanced.length >= 3 && new Set(advanced.map(r => r.question.domain)).size >= 3;
    }
    const evidence = responses.filter(r => correct(r) && r.question.level >= Math.max(1, level - 1));
    return evidence.some(r => r.question.level >= level) && new Set(evidence.map(r => r.question.domain)).size >= 3;
  };
  let grade = target;
  while (grade > 1 && !qualified(grade)) grade--;
  const supported = qualified(grade);
  const evidence = responses.filter(r => correct(r) && r.question.level >= Math.max(1, grade - 1));
  const timed = evidence.filter(r => r.elapsedMs !== undefined && r.elapsedMs! >= 1000);
  const fluent = timed.filter(r => r.elapsedMs! <= (r.question.expectedMs ?? 10000));
  const speed = timed.length < 3 ? '풀이 속도는 조금 더 확인이 필요해요.'
    : fluent.length / timed.length >= 0.7 ? '여러 유형을 빠르고 정확하게 풀었어요.'
    : '개념을 이해하고 있어요. 풀이 속도는 더 연습할 수 있어요.';
  const confidence = !supported ? '판정 근거 부족' : timed.length >= 3 && fluent.length / timed.length >= 0.7 ? '비교적 뚜렷한 결과' : '잠정 결과';
  const low = Math.max(1, grade - 1);
  const high = Math.min(MAX_LEVEL, grade + 1);
  const strengths = [...new Set(responses.filter(correct).map(r => r.question.concept))];
  const practice = [...new Set(responses.filter(r => !correct(r)).map(r => r.question.concept))];
  return { bestStreak: streakStats(responses).best, grade, label: levelLabel(grade), confidence, speed, supported, low, high, strengths, practice, elapsedMs: responses.reduce((sum, r) => sum + (r.elapsedMs ?? 0), 0), skips: responses.filter(r => r.skipped).length, timeouts: responses.filter(r => r.timedOut).length, score: responses.filter(correct).length };
}
