import type { Question } from './quiz';

// Work in integers (tenths for decimals) so answers never contain rounding noise.
export function generateQuestion(template: Question, random = Math.random): Question {
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
      return { ...template, prompt: `${a}/${d} ÷ ${b} = ?`, choices: [`${a}/${d * b}`, `${a * b}/${d}`, `${a}/${d}`, `${a}/${d * (b + 1)}`], answer: 0,
        explanation: `${b}로 나누는 것은 1/${b}을 곱하는 것과 같으므로 ${a}/${d * b}입니다. 약분 전 표현입니다.` };
    }
    default: throw new Error(`지원하지 않는 문제 유형: ${template.concept}`);
  }
}
