import type { Question } from './quiz';
import { generateConceptQuestion } from './concept-question';

function reducedFraction(numerator: number, denominator: number): string {
  let a = numerator, b = denominator;
  while (b !== 0) [a, b] = [b, a % b];
  const n = numerator / a, d = denominator / a;
  return d === 1 ? String(n) : `${n}/${d}`;
}

// Work in integers (tenths for decimals) so answers never contain rounding noise.
export function generateQuestion(template: Question, random = Math.random): Question {
  if (template.level >= 7) return generateConceptQuestion(template, random);
  const int = (min: number, max: number) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
  const decimal = (tenths: number) => (tenths / 10).toFixed(1);
  const numeric = (prompt: string, value: number, explanation: string, step = 1, format: (value: number) => string = String): Question => ({
    ...template, prompt, choices: [value, value - step, value + step, value + 2 * step].map(format), answer: 0, explanation,
  });
  switch (template.concept) {
    case '덧셈': {
      const a = int(1, 40), b = int(1, 9);
      return numeric(`${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}입니다.`);
    }
    case '뺄셈': {
      const a = int(10, 49), b = int(1, 9);
      return numeric(`${a} − ${b} = ?`, a - b, `${a} − ${b} = ${a - b}입니다.`);
    }
    case '두 자리 수의 덧셈':
    case '세 자리 수의 덧셈': {
      const min = template.grade === 2 ? 10 : 100;
      const max = template.grade === 2 ? 49 : 499;
      const a = int(min, max), b = int(min, max), sum = a + b;
      return { ...numeric(`${a} + ${b} = ?`, sum, `자리 값을 맞추어 더하면 ${a} + ${b} = ${sum}입니다.`), choices: [sum, sum - 10, sum + 10, sum + 1].map(String) };
    }
    case '곱셈구구': {
      const a = int(2, 9), b = int(2, 9);
      return numeric(`${a} × ${b} = ?`, a * b, `${a}을(를) ${b}번 더하면 ${a * b}입니다.`);
    }
    case '나눗셈': {
      const divisor = int(2, 9), quotient = int(2, 9), dividend = divisor * quotient;
      return numeric(`${dividend} ÷ ${divisor} = ?`, quotient, `${divisor} × ${quotient} = ${dividend}이므로 몫은 ${quotient}입니다.`);
    }
    case '분수의 덧셈': {
      const d = int(5, 20), a = int(1, d - 2), b = int(1, d - a - 1), sum = a + b;
      return { ...template, prompt: `${a}/${d} + ${b}/${d} = ?`, choices: [`${sum}/${d}`, `${sum}/${d * 2}`, `${sum + 1}/${d}`, `${sum + 2}/${d}`], answer: 0,
        explanation: `분모는 그대로 두고 분자를 더합니다. ${a} + ${b} = ${sum}이므로 답은 ${sum}/${d}입니다.` };
    }
    case '소수의 덧셈': {
      const a = int(11, 49), b = int(1, 29), sum = a + b;
      return numeric(`${decimal(a)} + ${decimal(b)} = ?`, sum, `소수점 위치를 맞추어 더하면 ${decimal(sum)}입니다.`, 1, decimal);
    }
    case '약수': {
      const divisor = int(2, 12), quotient = int(2, 9), n = divisor * quotient;
      // Every distractor is smaller than n and explicitly fails divisibility.
      const wrong: number[] = [];
      for (let candidate = 2; candidate < n && wrong.length < 3; candidate++) {
        if (n % candidate !== 0) wrong.push(candidate);
      }
      for (let candidate = n + 1; wrong.length < 3; candidate++) wrong.push(candidate);
      return { ...template, prompt: `${n}의 약수인 수는 무엇인가요?`, choices: [divisor, ...wrong].map(String), answer: 0,
        explanation: `${n} ÷ ${divisor} = ${quotient}로 나누어떨어지므로 ${divisor}은(는) ${n}의 약수입니다.` };
    }
    case '소수의 곱셈': {
      const a = int(11, 49), b = int(2, 9), product = a * b;
      return numeric(`${decimal(a)} × ${b} = ?`, product, `${a} × ${b} = ${product}에서 소수 자리를 반영하면 ${decimal(product)}입니다.`, 1, decimal);
    }
    case '소수의 나눗셈': {
      const divisor = int(2, 9), quotient = int(2, 9), dividend = divisor * quotient;
      return numeric(`${decimal(dividend)} ÷ ${decimal(divisor)} = ?`, quotient,
        `두 수를 각각 10배 하면 ${dividend} ÷ ${divisor}이므로 답은 ${quotient}입니다.`);
    }
    case '분수의 나눗셈': {
      const d = int(3, 15), a = int(1, d - 1), b = int(2, 5);
      const rawAnswer = `${a}/${d * b}`;
      const answer = reducedFraction(a, d * b);
      // Canonical representations collapse equivalent fractions before selecting choices.
      const choices = [...new Set([
        answer, reducedFraction(a * b, d), reducedFraction(a, d), reducedFraction(a, d * (b + 1)),
      ])];
      for (let extra = b + 2; choices.length < 4; extra++) {
        const candidate = reducedFraction(a, d * extra);
        if (!choices.includes(candidate)) choices.push(candidate);
      }
      const reduction = answer === rawAnswer ? '' : ` 분자와 분모를 약분하면 ${answer}입니다.`;
      return { ...template, prompt: `${a}/${d} ÷ ${b} = ?`, choices, answer: 0,
        explanation: `${b}로 나누는 것은 1/${b}을 곱하는 것과 같습니다. ${a}/${d} × 1/${b} = ${rawAnswer}입니다.${reduction}` };
    }
    case '모양 찾기': {
      const names = ['삼각형', '사각형', '오각형', '육각형'];
      const index = int(0, 1), sides = index + 3;
      const property = int(0, 1) === 0 ? '변' : '꼭짓점';
      return { ...template, prompt: `${property}이 ${sides}개인 평면 모양은?`, choices: names, answer: index,
        explanation: `${names[index]}은 ${property}이 ${sides}개입니다.` };
    }
    case '수의 순서': {
      const n = int(2, 80);
      return numeric(`${n} 바로 다음의 수는?`, n + 1, `${n}보다 1 큰 수는 ${n + 1}입니다.`);
    }
    case '길이 단위': {
      const m = int(1, 8), cm = int(1, 90);
      return numeric(`${m}m ${cm}cm는 몇 cm인가요?`, m * 100 + cm, `1m는 100cm이므로 ${m * 100 + cm}cm입니다.`, 10);
    }
    case '수의 규칙': {
      const a = int(1, 30), d = int(2, template.level === 2 ? 5 : 12);
      return numeric(`${a}, ${a + d}, ${a + 2 * d}, ? — 같은 규칙으로 이어지는 수는?`, a + 3 * d, `${d}씩 커지므로 다음 수는 ${a + 3 * d}입니다.`, d);
    }
    case '시간 계산': {
      const hour = int(1, 10), minute = int(30, 50), duration = int(20, 40);
      const total = minute + duration;
      return { ...numeric(`${hour}시 ${minute}분에서 ${duration}분 뒤는?`, hour + Math.floor(total / 60), `분을 더하고 60분을 1시간으로 바꾸면 ${hour + Math.floor(total / 60)}시 ${total % 60}분입니다.`), choices: [0, -1, 1, 2].map(offset => `${hour + Math.floor(total / 60) + offset}시 ${total % 60}분`) };
    }
    case '정사각형의 변': {
      const side = int(2, 20);
      return numeric(`정사각형의 한 변이 ${side}cm입니다. 나머지 한 변은 몇 cm인가요?`, side, `정사각형의 네 변은 모두 같으므로 ${side}cm입니다.`);
    }
    case '각도 계산': {
      const a = int(2, 15) * 10;
      return numeric(`일직선 위의 두 이웃한 각 중 하나가 ${a}°입니다. 다른 각은 몇 도인가요?`, 180 - a, `두 각의 합이 180°이므로 ${180 - a}°입니다.`, 10);
    }
    case '직사각형의 넓이': {
      const a = int(3, 12), b = int(2, 9);
      return numeric(`가로 ${a}cm, 세로 ${b}cm인 직사각형의 넓이는 몇 cm²인가요?`, a * b, `가로 × 세로 = ${a * b}cm²입니다.`);
    }
    case '평균': {
      const a = int(5, 30), d = int(1, 4);
      return numeric(`${a - d}, ${a}, ${a + d}의 평균은?`, a, `세 수의 합 ${3 * a}을 3으로 나누면 ${a}입니다.`);
    }
    case '직육면체의 부피': {
      const a = int(2, 7), b = int(2, 6), c = int(2, 5);
      return numeric(`가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 부피는 몇 cm³인가요?`, a * b * c, `가로 × 세로 × 높이 = ${a * b * c}cm³입니다.`);
    }
    case '백분율': {
      const percent = int(1, 9) * 10, total = int(2, 10) * 10;
      return numeric(`${total}의 ${percent}%는?`, total * percent / 100, `${total} × ${percent}/100 = ${total * percent / 100}입니다.`);
    }
    case '수 비교': {
      const a = int(10, 80), b = a + int(1, 9);
      return numeric(`${a}와 ${b} 중 더 큰 수는?`, b, `${b}가 ${a}보다 크므로 답은 ${b}입니다.`);
    }
    case '두 자리 수의 뺄셈': {
      const a = int(40, 90), b = int(12, 39);
      return numeric(`${a} − ${b} = ?`, a - b, `자리 값을 맞추어 빼면 ${a - b}입니다.`);
    }
    case '나눗셈의 나머지': {
      const d = int(3, 9), q = int(2, 9), r = int(1, d - 1);
      return { ...numeric(`${d * q + r} ÷ ${d}의 나머지는?`, r, `${d * q + r} = ${d} × ${q} + ${r}이므로 나머지는 ${r}입니다.`), choices: [r, 0, d, d + 1].map(String) };
    }
    case '직사각형의 둘레': {
      const a = int(3, 15), b = int(2, 10);
      return numeric(`가로 ${a}cm, 세로 ${b}cm인 직사각형의 둘레는 몇 cm인가요?`, 2 * (a + b), `네 변을 더하면 2 × (${a} + ${b}) = ${2 * (a + b)}cm입니다.`, 2);
    }
    case '최대공약수': {
      const g = int(2, 12), a = g * 2, b = g * 3;
      return numeric(`${a}과 ${b}의 최대공약수는?`, g, `두 수를 공통으로 나누는 가장 큰 수는 ${g}입니다.`);
    }
    case '비례식': {
      const a = int(2, 9), b = int(2, 9), scale = int(2, 5);
      return numeric(`${a} : ${b} = ${a * scale} : □에서 □에 들어갈 수는?`, b * scale, `앞 항이 ${scale}배가 되었으므로 뒤 항도 ${scale}배인 ${b * scale}입니다.`);
    }
    default: throw new Error(`지원하지 않는 문제 유형: ${template.concept}`);
  }
}
