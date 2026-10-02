# 몇 학년? · What Grade

로그인 없이 10문제로 초등 수와 연산 학습 수준을 가볍게 알아보는 웹앱.

## 실행

Node.js 22.12 이상 또는 지원되는 최신 LTS 버전을 사용한다.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## 배포

Cloudflare Workers의 정적 파일 호스팅을 사용한다. 계정 인증 후 배포한다.

```sh
npx wrangler login
npm run deploy
```

실제 배포는 아직 수행하지 않았다. 기본 Worker 이름은 `wrangler.jsonc`의 `what-grade`이며 필요시 변경한다.

## 구성

- `src/App.tsx`: 시작, 퀴즈, 결과, 공유 및 답안 해설 화면
- `src/quiz.ts`: 적응형 문제 선택과 수준 추정 로직
- `src/question-generator.ts`: 12개 유형의 숫자·정답·보기·해설을 학년별 범위 안에서 무작위 생성
- `data/questions/math/grade-1.json` ~ `grade-6.json`: 출제 슬롯과 학년·개념 메타데이터 (고정 문항은 런타임에 생성 문항으로 대체)
- [프로젝트 방향](docs/product-plan.md)
- [교육과정 초안](docs/curriculum/elementary-math.md)
- [초기 출제 규칙](docs/quiz/level-estimation.md)

문제 데이터는 구현 검증용 초안이다. 교과서·성취기준 대조와 사용자 응답 기반 난이도 검증은 아직 필요하다. 결과는 실제 학년이나 전체 수학 능력을 진단하지 않는다. 브라우저에서 채점하므로 경쟁 랭킹 도입 전 서버 채점이 필요하다.

같은 유형도 출제할 때마다 숫자를 새로 뽑는다. 한 회차 안에서는 같은 문제 문구를 재출제하지 않으며, 보기 순서도 섞는다. 회차 간 우연한 중복은 가능하다. 나눗셈은 나누어떨어지도록 만들고, 분수 보기는 값이 겹치지 않도록 구성한다.
