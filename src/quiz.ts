import { generateQuestion } from './question-generator';
import grade1 from '../data/questions/math/grade-1.json';
import grade2 from '../data/questions/math/grade-2.json';
import grade3 from '../data/questions/math/grade-3.json';
import grade4 from '../data/questions/math/grade-4.json';
import grade5 from '../data/questions/math/grade-5.json';
import grade6 from '../data/questions/math/grade-6.json';

export type Question = {
  id: string; schoolLevel: 'elementary' | 'middle'; grade: number; level: number; concept: string; prompt: string;
  choices: string[]; answer: number; explanation: string;
};
export type Response = { question: Question; selected: number | null; elapsedMs?: number; timedOut?: boolean };
const elementary: Question[] = [...grade1, ...grade2, ...grade3, ...grade4, ...grade5, ...grade6]
  .map(q => ({ ...q, schoolLevel: 'elementary', level: q.grade }));
const middleConcepts = [
  ['정수의 덧셈', '일차방정식', '정비례'],
  ['지수법칙', '연립일차방정식', '피타고라스 정리'],
  ['제곱근', '이차방정식', '이차함수'],
];
const middle: Question[] = middleConcepts.flatMap((concepts, index) => concepts.flatMap(concept =>
  Array.from({ length: 4 }, (_, slot) => ({
    id: `math-middle-${index + 1}-${concept}-${slot + 1}`, schoolLevel: 'middle' as const,
    grade: index + 1, level: index + 7, concept, prompt: '', choices: [], answer: 0, explanation: '',
  }))));
// Concrete samples keep the exported bank usable for previews and validation.
export const questions: Question[] = [...elementary, ...middle.map(q => generateQuestion(q, () => 0))];
export const START_LEVEL = 5;
export const MAX_LEVEL = 9;
export function levelLabel(level: number): string {
  return level <= 6 ? `초등 ${level}학년` : `중학교 ${level - 6}학년`;
}
export const TOTAL = 10;
export const correct = (response: Response) => response.selected === response.question.answer;

// Two answers at one level are required before changing the target grade.
export function targetGrade(responses: Response[]): number {
  let grade = START_LEVEL;
  for (let i = 0; i + 1 < responses.length; i += 2) {
    const pair = responses.slice(i, i + 2);
    if (pair.every(correct)) grade = Math.min(MAX_LEVEL, grade + 1);
    else if (pair.every(r => !correct(r))) grade = Math.max(1, grade - 1);
  }
  return grade;
}

export function nextQuestion(responses: Response[], random = Math.random): Question | undefined {
  if (responses.length >= TOTAL) return undefined;
  const used = new Set(responses.map(r => r.question.id));
  const remaining = questions.filter(q => !used.has(q.id));
  const target = targetGrade(responses);
  const distance = Math.min(...remaining.map(q => Math.abs(q.level - target)));
  const nearby = remaining.filter(q => Math.abs(q.level - target) === distance);
  const differentConcept = responses.length % 2 === 1
    ? nearby.filter(q => q.concept !== responses.at(-1)?.question.concept)
    : nearby;
  const pool = differentConcept.length ? differentConcept : nearby;
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

export function result(responses: Response[]) {
  const grade = targetGrade(responses);
  const low = Math.max(1, grade - 1);
  const high = Math.min(MAX_LEVEL, grade + 1);
  const strengths = [...new Set(responses.filter(correct).map(r => r.question.concept))];
  const practice = [...new Set(responses.filter(r => !correct(r)).map(r => r.question.concept))];
  return { grade, label: levelLabel(grade), low, high, strengths, practice, elapsedMs: responses.reduce((sum, r) => sum + (r.elapsedMs ?? 0), 0), timeouts: responses.filter(r => r.timedOut).length, score: responses.filter(correct).length };
}
