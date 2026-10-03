import { describe, expect, it } from 'vitest';
import { generateQuestion } from './question-generator';
import { questions } from './quiz';

const values = (text: string) => (text.match(/[−-]?\d+/g) ?? []).map(s => Number(s.replace('−','-')));
const fraction = (s: string) => { const [a,b=1] = s.split('/').map(Number); return a/b; };

describe('concept questions for middle school through high one', () => {
  it('validates randomized answers against equations, definitions and counting identities', () => {
    let seed=782;
    const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
    const templates = [...new Map(questions.filter(q=>q.level>=7).map(q=>[q.concept,q])).values()];
    for(const template of templates) for(let sample=0;sample<80;sample++) {
      const q=generateQuestion(template,rng), n=values(q.prompt), answer=q.choices[q.answer], v=Number(answer);
      expect(q.choices, q.concept).toHaveLength(4);
      expect(new Set(q.choices).size, q.concept).toBe(4);
      expect(q.explanation.replaceAll('−','-'), q.concept).toContain(answer.replaceAll('−','-'));
      switch(q.concept) {
        case '정수의 덧셈': expect(v+n[0]).toBe(n[1]); break;
        case '정수의 곱셈': expect(n[0]*v).toBe(n[1]); break;
        case '일차방정식': expect(n[0]*(v+n[1])).toBe(n[2]); break;
        case '정비례': expect(n[1]/n[0]).toBe(n[2]/v); break;
        case '삼각형의 내각': expect(180-v+n[0]+n[1]).toBe(180); break;
        case '다각형의 내각의 합': expect(v-2).toBe(n[0]); break;
        case '중앙값': expect(v).toBe([...n].sort((a,b)=>a-b)[2]); break;
        case '지수법칙': expect(n[0]**(2*n[1])/n[2]**n[3]).toBe(n[4]**v); break;
        case '연립일차방정식': expect(2*(n[0]-v)+3*v).toBe(n[3]); break;
        case '일차부등식': {
          expect(n[0]-n[1]*v).toBeLessThan(n[2]);
          expect(n[0]-n[1]*(v-1)).toBeGreaterThanOrEqual(n[2]); break;
        }
        case '일차함수의 기울기': expect(n[1]+v*(n[2]-n[0])).toBe(n[3]); break;
        case '피타고라스 정리': expect(v*v+n[1]**2).toBe(n[0]**2); break;
        case '닮음비': expect(v).toBe(n[1]**2); break;
        case '확률': {
          const [red,blue]=n, total=red+blue;
          let success=0, outcomes=0;
          for(let first=0;first<total;first++) for(let second=0;second<total;second++) if(first!==second) {
            outcomes++; if(first<red&&second<red) success++;
          }
          expect(fraction(answer)).toBeCloseTo(success/outcomes); break;
        }
        case '제곱근': {
          const roots=values(answer);
          expect(roots).toHaveLength(2);
          expect(roots.every(x=>x*x===n[0])).toBe(true);
          expect(roots[0]).toBe(-roots[1]); break;
        }
        case '근호의 계산': expect(v).toBeGreaterThanOrEqual(0); expect(v*v).toBe(n[0]**2); break;
        case '이차방정식': case '이차방정식의 두 근': {
          const roots=values(answer);
          expect(roots).toHaveLength(2);
          expect(roots).toContain(0);
          expect(roots.every(x=>x*x===n[0]*x)).toBe(true); break;
        }
        case '인수분해': {
          const factors=values(answer), [sum,product]=n;
          for(const x of [-3,0,2]) expect((x+factors[0])*(x+factors[1])).toBeCloseTo(x*x+sum*x+product); break;
        }
        case '이차함수': case '이차함수의 꼭짓점': {
          for(let x=n[0]-3;x<=n[0]+3;x++) expect((v-n[0])**2+n[1]).toBeLessThanOrEqual((x-n[0])**2+n[1]); break;
        }
        case '삼각비': case '삼각비로 길이 구하기': expect(v/n[2]).toBeCloseTo(n[0]/n[1]); break;
        case '분산': case '표준편차': {
          const sd=q.concept==='표준편차', d=sd?n[0]:Math.sqrt(n[0]);
          const data=[-d,d].map(x=>x*n[1]), mean=(data[0]+data[1])/2;
          const variance=data.reduce((a,x)=>a+(x-mean)**2,0)/2;
          expect(v).toBe(sd?Math.sqrt(variance):variance); break;
        }
        case '나머지정리': expect(n[1]**2+v*n[1]+n[0]).toBe(n[2]); break;
        case '판별식': {
          expect(n[0]**2-4*v).toBeGreaterThan(0);
          expect(n[0]**2-4*(v+1)).toBeLessThanOrEqual(0); break;
        }
        case '복소수의 계산': expect(v).toBe(n[1]*n[2]+n[2]*n[1]); break;
        case '조합': {
          let count=0;
          for(let a=0;a<n[0];a++) for(let b=a+1;b<n[0];b++) for(let c=b+1;c<n[0];c++) if(a===0) count++;
          expect(v).toBe(count); break;
        }
        case '집합의 원소 수': {
          let count=0;
          for(let mask=0;mask<2**(n.length+2);mask++) if((mask&1)&&!(mask&2)) count++;
          expect(v).toBe(count); break;
        }
        case '합성함수': expect(v).toBe((n[0]*n[2]+n[1])**2); break;
        case '역함수': expect(fraction(answer)*n[0]).toBe(1); break;
        case '원의 방정식': expect(2*v).toBe(n[0]); break;
        default: throw Error(q.concept);
      }
    }
  });
  it('handles the lower and upper random boundaries without ambiguous options',()=>{
    for(const q of questions.filter(q=>q.level>=7)) for(const draw of [0,0.999999]) {
      const generated=generateQuestion(q,()=>draw);
      expect(new Set(generated.choices).size,q.concept).toBe(4);
    }
  });
});
