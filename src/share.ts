export type SharedRecord = { grade: number; score: number; seconds: number };
export const SHARE_VERSION = 'v1';
export function parseSharedRecord(path: string): SharedRecord | null {
  const match = path.match(/^\/share\/v1\/(10|[1-9])\/(10|[0-9])\/(0|[1-9]\d{0,2})\/?$/);
  if (!match) return null;
  const seconds = Number(match[3]);
  if (seconds > 200) return null;
  return { grade: Number(match[1]), score: Number(match[2]), seconds };
}
export function sharePath(record: SharedRecord): string {
  return `/share/${SHARE_VERSION}/${record.grade}/${record.score}/${record.seconds}`;
}
export function shareTitle(record: SharedRecord): string {
  const grade = record.grade <= 6 ? `초등 ${record.grade}학년` : record.grade <= 9 ? `중학교 ${record.grade - 6}학년` : `고등학교 ${record.grade - 9}학년`;
  return `나의 수학 나이는 ${grade}!`;
}
export function shareDescription(record: SharedRecord): string {
  return `10문제 중 ${record.score}개 정답 · ${record.seconds}초. 당신은 몇 학년? 도전해보세요!`;
}
