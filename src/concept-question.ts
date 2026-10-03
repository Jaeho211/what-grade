import type { Question } from './quiz';

// Short tasks test a relation, a constraint or a definition, rather than naming a formula.
export function generateConceptQuestion(template: Question, random = Math.random): Question {
  const int = (a: number, b: number) => a + Math.min(b-a, Math.floor(random()*(b-a+1)));
  const fraction = (a: number, b: number) => {
    let x=a, y=b; while(y) [x,y]=[y,x%y];
    return b/x === 1 ? String(a/x) : `${a/x}/${b/x}`;
  };
  const number = (prompt: string, answer: number, explanation: string): Question => ({ ...template, prompt,
    choices: [answer,answer-1,answer+1,answer+2].map(String), answer: 0, explanation });
  const choose = (prompt: string, answer: string, wrong: string[], explanation: string): Question => ({ ...template,
    prompt, choices: [answer,...wrong], answer: 0, explanation });
  switch(template.concept) {
    case '정수의 덧셈': {
      const a=int(2,12), b=int(2,12);
      return number(`x + (−${a}) = −${b}일 때 x는?`,a-b,`양변에 ${a}을 더하면 x = ${a} − ${b} = ${a-b}입니다.`);
    }
    case '정수의 곱셈': {
      const a=int(2,9), b=int(2,9);
      return number(`(−${a}) × x = ${a*b}일 때 x는?`,-b,`음수와 곱해 양수가 되려면 x도 음수여야 합니다. x = −${b}입니다.`);
    }
    case '일차방정식': {
      const a=int(2,5), x=int(2,7), b=int(1,5);
      return number(`${a}(x + ${b}) = ${a*x}에서 x는?`,x-b,`괄호를 전개하면 ${a}x + ${a*b} = ${a*x}입니다. 따라서 x = ${x-b}입니다.`);
    }
    case '정비례': {
      const a=int(2,5), x=int(2,5);
      return number(`y는 x에 정비례합니다. x = ${x}일 때 y = ${a*x}입니다. y = ${a*(x+2)}일 때 x는?`,x+2,`비례상수는 ${a*x}/${x} = ${a}입니다. y를 ${a}로 나누면 x = ${x+2}입니다.`);
    }
    case '삼각형의 내각': {
      const a=int(3,8)*10, b=int(2,7)*10;
      return number(`삼각형의 두 내각은 ${a}°, ${b}°입니다. 나머지 꼭짓점에서 한 변을 연장해 만든 외각은 몇 도인가요?`,a+b,`외각은 이웃하지 않은 두 내각의 합이므로 ${a+b}°입니다.`);
    }
    case '다각형의 내각의 합': {
      const n=int(5,10);
      return number(`한 꼭짓점에서 대각선을 그어 겹치지 않는 삼각형 ${n-2}개로 나눈 다각형은 몇 각형인가요?`,n,`n각형은 n − 2개의 삼각형으로 나뉩니다. 따라서 ${n}각형입니다.`);
    }
    case '중앙값': {
      const a=int(8,20), d=int(1,3), high=a+3*d;
      return number(`자료 ${a-d}, ${a}, ${a+d}, ${high}에 ${high+int(5,12)}를 추가했습니다. 새 중앙값은?`,a+d,`자료가 5개이므로 정렬한 세 번째 값 ${a+d}가 중앙값입니다. 큰 값의 크기 자체는 중앙값을 바꾸지 않습니다.`);
    }
    case '지수법칙': {
      const b=int(2,5), a=int(2,4), c=int(1,3);
      return number(`(${b}^${a})² ÷ ${b}^${c} = ${b}^n일 때 n은?`,2*a-c,`거듭제곱의 지수는 곱하고 나눗셈의 지수는 뺍니다. n = 2 × ${a} − ${c} = ${2*a-c}입니다.`);
    }
    case '연립일차방정식': {
      const x=int(2,7), y=int(2,7);
      return number(`x + y = ${x+y}, 2x + 3y = ${2*x+3*y}일 때 y는?`,y,`첫 식을 2배 한 뒤 둘째 식에서 빼면 y = ${y}입니다.`);
    }
    case '일차부등식': {
      const k=int(2,8), a=int(2,5), b=int(1,6);
      return number(`${b} − ${a}x < ${b-a*k}를 만족하는 가장 작은 정수 x는?`,k+1,`음수 −${a}로 나누면 부등호가 바뀌어 x > ${k}입니다. 가장 작은 정수는 ${k+1}입니다.`);
    }
    case '일차함수의 기울기': {
      const a=int(2,5), x=int(1,4), y=int(2,8), dx=int(2,4);
      return number(`일차함수 그래프가 (${x}, ${y}), (${x+dx}, ${y+a*dx})를 지납니다. 기울기는?`,a,`기울기는 y의 변화량을 x의 변화량으로 나눈 값이므로 ${a*dx}/${dx} = ${a}입니다.`);
    }
    case '피타고라스 정리': {
      const [a,b,c]=[[3,4,5],[5,12,13],[8,15,17]][int(0,2)], scale=int(1,3);
      return number(`직각삼각형의 빗변은 ${c*scale}cm, 한 직각변은 ${a*scale}cm입니다. 다른 직각변은 몇 cm인가요?`,b*scale,`직각변의 제곱은 빗변의 제곱에서 다른 직각변의 제곱을 뺀 값입니다. 길이는 ${b*scale}cm입니다.`);
    }
    case '닮음비': {
      const scale=int(2,5), area=int(2,8);
      return number(`두 삼각형의 닮음비는 1 : ${scale}입니다. 작은 삼각형의 넓이가 ${area}cm²일 때 큰 삼각형의 넓이는 몇 cm²인가요?`,area*scale**2,`넓이비는 닮음비의 제곱인 1 : ${scale**2}이므로 ${area*scale**2}cm²입니다.`);
    }
    case '확률': {
      const red=int(2,5), blue=int(2,5), total=red+blue, answer=fraction(red*(red-1),total*(total-1));
      const second=fraction(red-1,total-1), first=fraction(red,total);
      return choose(`빨간 공 ${red}개, 파란 공 ${blue}개에서 공을 하나씩 2번 뽑고 돌려놓지 않습니다. 모두 빨간 공일 확률은?`,answer,[first,second,'1'],`첫 확률 ${first}와 두 번째 확률 ${second}를 곱하면 ${answer}입니다. 첫 공을 뽑은 뒤 전체 개수와 빨간 공 개수가 모두 줄어듭니다.`);
    }
    case '제곱근': {
      const n=int(2,12);
      return choose(`${n*n}의 제곱근을 모두 고르면?`,`−${n}, ${n}`,[`${n}`,`−${n}`,`${n*n}`],`제곱해서 ${n*n}이 되는 수는 −${n}, ${n}입니다. 양수의 제곱근은 두 개입니다.`);
    }
    case '근호의 계산': {
      const n=int(2,9);
      return number(`x = −${n}일 때 x²의 음이 아닌 제곱근은?`,n,`√(x²)는 x의 절댓값입니다. x가 음수이므로 값은 ${n}입니다.`);
    }
    case '이차방정식':
    case '이차방정식의 두 근': {
      const a=int(2,8);
      return choose(`x² = ${a}x의 모든 해는?`,`0, ${a}`,[`${a}`,`−${a}, ${a}`,`0, −${a}`],`x(x − ${a}) = 0이므로 해는 0, ${a}입니다. 양변을 x로 나누면 0인 해를 놓칩니다.`);
    }
    case '인수분해': {
      const a=int(2,7), b=a+int(1,4);
      return choose(`x² + ${a+b}x + ${a*b}의 인수분해는?`,`(x + ${a})(x + ${b})`,[`(x − ${a})(x − ${b})`,`(x + ${a})(x − ${b})`,`(x − ${a})(x + ${b})`],`상수의 곱이 ${a*b}, 합이 ${a+b}인 두 수는 ${a}, ${b}이므로 (x + ${a})(x + ${b})입니다.`);
    }
    case '이차함수':
    case '이차함수의 꼭짓점': {
      const h=int(2,6), k=int(2,9);
      return number(`y = (x − ${h})² + ${k}에서 x가 ${h-2}부터 ${h+1}까지 증가합니다. y가 가장 작을 때 x는?`,h,`제곱항이 0일 때 가장 작습니다. 구간 안에 x = ${h}가 있으므로 답은 ${h}입니다.`);
    }
    case '삼각비':
    case '삼각비로 길이 구하기': {
      const [a,b]=[[3,4],[5,12],[8,15]][int(0,2)], scale=int(1,3);
      return number(`직각삼각형에서 tan A = ${a}/${b}입니다. 각 A에 이웃한 직각변이 ${b*scale}cm일 때 맞은편 변은 몇 cm인가요?`,a*scale,`tan A는 맞은편 직각변을 이웃한 직각변으로 나눈 값입니다. 맞은편 변은 ${a*scale}cm입니다. 빗변과 혼동하지 않습니다.`);
    }
    case '분산':
    case '표준편차': {
      const d=int(2,6), shift=int(2,8), scale=int(2,4), sd=template.concept==='표준편차', initial=sd?d:d*d, value=sd?d*scale:d*d*scale*scale;
      return number(`자료의 ${template.concept}는 ${initial}입니다. 모든 값에 ${shift}를 더한 뒤 ${scale}배 하면 새 ${template.concept}는?`,value,`평행 이동은 퍼진 정도를 바꾸지 않습니다. ${template.concept}는 ${sd?'배율':'배율의 제곱'}만큼 변하므로 ${value}입니다.`);
    }
    case '나머지정리': {
      const k=int(1,3), c=int(1,6), a=int(1,5), rem=k*k+a*k+c;
      return number(`다항식 x² + ax + ${c}을 x − ${k}로 나눈 나머지가 ${rem}입니다. a는?`,a,`x = ${k}를 대입한 값이 나머지입니다. ${k*k} + ${k}a + ${c} = ${rem}을 풀면 a = ${a}입니다.`);
    }
    case '판별식': {
      const h=int(2,6), bound=h*h;
      return number(`x² − ${2*h}x + k = 0이 서로 다른 두 실근을 가집니다. 정수 k의 최댓값은?`,bound-1,`판별식이 양수여야 하므로 ${4*bound} − 4k > 0, k < ${bound}입니다. 정수 최댓값은 ${bound-1}입니다.`);
    }
    case '복소수의 계산': {
      const a=int(1,5), b=int(1,5), value=2*a*b;
      return number(`i² = −1일 때 (${a} + ${b}i)²의 허수 부분은?`,value,`허수 부분은 i의 계수입니다. 제곱을 전개하면 i의 계수는 2 × ${a} × ${b} = ${value}입니다.`);
    }
    case '조합': {
      const n=int(4,9), answer=(n-1)*(n-2)/2;
      return number(`서로 다른 ${n}명 중 대표 3명을 순서 없이 고릅니다. A가 반드시 포함되는 방법은 몇 가지인가요?`,answer,`A를 고정하고 나머지 ${n-1}명 중 2명을 고릅니다. ${n-1} × ${n-2} ÷ 2 = ${answer}가지입니다.`);
    }
    case '집합의 원소 수': {
      const n=int(4,8), answer=2**(n-2);
      return number(`원소가 ${n}개인 집합 A에 서로 다른 원소 a, b가 있습니다. a는 포함하고 b는 포함하지 않는 A의 부분집합은 몇 개인가요?`,answer,`a와 b의 포함 여부는 정해져 있습니다. 나머지 ${n-2}개 원소는 각각 포함 여부를 선택하므로 2^${n-2} = ${answer}개입니다.`);
    }
    case '합성함수': {
      const a=int(2,4), b=int(1,5), x=int(1,3), answer=(a*x+b)**2;
      return number(`f(x) = ${a}x + ${b}, g(x) = x²일 때 g(f(${x}))는?`,answer,`안쪽 함수부터 적용합니다. f(${x}) = ${a*x+b}, g(${a*x+b}) = ${answer}입니다.`);
    }
    case '역함수': {
      const h=int(2,6), d=int(2,5), k=int(1,6), answer=h-d;
      return number(`x가 ${h} 이하일 때 f(x) = (x − ${h})² + ${k}입니다. 역함수 g에 대해 g(${d*d+k})는?`,answer,`(x − ${h})² = ${d*d}이지만 정의역은 x가 ${h} 이하입니다. 따라서 x − ${h} = −${d}, g(${d*d+k}) = ${answer}입니다.`);
    }
    case '원의 방정식': {
      const h=int(2,6), k=int(2,6), r=int(2,5), answer=h*h+k*k-r*r;
      return number(`원 x² + y² − ${2*h}x − ${2*k}y + ${answer < 0 ? `(${answer})` : answer} = 0의 중심의 x좌표는?`,h,`완전제곱식으로 정리하면 (x − ${h})² + (y − ${k})² = ${r*r}입니다. 중심의 x좌표는 ${h}입니다.`);
    }
    default: throw new Error(`지원하지 않는 개념 문제: ${template.concept}`);
  }
}
