import { useEffect, useRef, useState } from 'react';
import { correct, nextQuestion, result, TOTAL, type Question, type Response } from './quiz';

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [responses, setResponses] = useState<Response[]>([]);
  const [question, setQuestion] = useState<Question>();
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, question]);
  function start() {
    setResponses([]); setQuestion(nextQuestion([])); setSelected(null); setNotice(''); setScreen('quiz');
  }
  function submit(answer: number | null) {
    if (!question) return;
    const updated = [...responses, { question, selected: answer }];
    setResponses(updated); setSelected(null);
    if (updated.length === TOTAL) setScreen('result');
    else setQuestion(nextQuestion(updated));
  }
  const summary = result(responses);
  const shareText = `내 수학은 몇 학년? 초등 ${summary.low}~${summary.high}학년 수와 연산 수준! 10문제 중 ${summary.score}문제를 맞혔어요. 나도 도전하기: ${window.location.origin}`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: '내 수학은 몇 학년?', text: shareText });
      else { await navigator.clipboard.writeText(shareText); setNotice('결과를 복사했어요. 친구에게 보내보세요!'); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotice('공유하지 못했어요. 아래 결과 문구를 직접 복사해주세요.');
    }
  }
  return <div className="shell">
    <header><a className="brand" href="/" aria-label="몇 학년 홈"><span className="brand-mark">몇</span>몇 학년<span className="brand-dot">?</span></a><span className="header-tag">작은 도전, 새로운 발견</span></header>
    <main>
      {screen === 'intro' && <div className="intro">
        <section className="intro-copy"><span className="eyebrow">MATH LEVEL CHECK · 수학 편</span>
          <h1 ref={heading} tabIndex={-1}>내 수학은<br />지금 <span>몇 학년?</span></h1>
          <p className="lead">분명 배웠는데, 아직 기억날까?<br />10문제로 지금의 수학 감각을 알아보세요.</p>
          <div className="chips"><span>✦ 초등 수와 연산</span><span>◷ 시간 제한 없음</span><span>↗ 로그인 없이</span></div>
          <button className="primary start" onClick={start}>10문제로 알아보기 <span>→</span></button>
          <p className="fine">점수보다 발견이 중요한 시간. 편하게 풀어보세요.</p>
        </section>
        <section className="illustration" aria-label="수학 노트 그림"><div className="orbit one">÷</div><div className="orbit two">＋</div><div className="orbit three">×</div><div className="notebook"><div className="note-top">TODAY’S LITTLE CHALLENGE <span>✦</span></div><div className="note-question">나의 수학 감각은?</div><div className="equation">3 × 4 = <span>?</span></div><div className="note-lines"><i /><i /><i /></div><div className="note-bottom"><span>호기심만 챙겨오세요</span><span>↗</span></div></div><div className="sticker">딱 10문제!</div></section>
        <section className="how"><div><b>01</b><span>가볍게 풀고</span><p>내 답에 맞춰 달라지는 문제</p></div><div><b>02</b><span>나를 발견하고</span><p>학습 수준과 개념 돌아보기</p></div><div><b>03</b><span>함께 도전해요</span><p>친구에게 결과 공유하기</p></div></section>
      </div>}
      {screen === 'quiz' && question && <section className="quiz panel">
        <div className="quiz-top"><span className="eyebrow">수학 감각 알아보는 중</span><span className="counter">{responses.length + 1} <span>/ {TOTAL}</span></span></div>
        <div className="progress" role="progressbar" aria-label="답변 완료" aria-valuenow={responses.length} aria-valuemin={0} aria-valuemax={TOTAL}><div style={{ width: `${responses.length / TOTAL * 100}%` }} /></div>
        <span className="question-label">QUESTION {String(responses.length + 1).padStart(2, '0')}</span>
        <h1 className="question" ref={heading} tabIndex={-1}>{question.prompt}</h1>
        <p className="question-help" id="choice-help">답을 하나 고르고 다음으로 넘어가세요.</p>
        <div className="choices" role="group" aria-label="답 선택" aria-describedby="choice-help">{question.choices.map((choice, i) => <button key={`${question.id}-${i}`} className={`choice ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><span className="choice-number">{i + 1}</span>{choice}<span className="check">{selected === i ? '✓' : ''}</span></button>)}</div>
        <div className="quiz-actions">
          <button className="primary" disabled={selected === null} onClick={() => submit(selected)}>{responses.length === TOTAL - 1 ? '결과 알아보기' : '다음 문제'} <span>→</span></button>
          <button className="skip" onClick={() => submit(null)}>모르겠어요 · 넘어가기</button>
        </div>
        <p className="fine center">정답과 해설은 끝나고 함께 확인해요.</p>
      </section>}
      {screen === 'result' && <section className="results">
        <div className="result-hero"><span className="eyebrow">YOUR MATH MOMENT</span><div className="result-icon">✦</div><h1 ref={heading} tabIndex={-1}>지금 나의 수학 감각은</h1><p className="grade">초등 {summary.low}~{summary.high}학년</p><p className="lead">수와 연산 학습 수준</p><span className="score">10문제 중 {summary.score}문제 정답</span><p className="fine">10문제 답변으로 살펴본 가벼운 추정이에요.<br />실제 학년이나 전체 수학 능력을 의미하지 않아요.</p></div>
        <div className="insights"><div className="insight"><span>✦ 잘 풀었어요</span><h2>이 감각, 살아있네요!</h2><p>{summary.strengths.join(' · ') || '아직 확인한 개념이 없어요. 쉬운 문제부터 다시 도전해봐요.'}</p></div><div className="insight practice"><span>↗ 다시 만나볼 개념</span><h2>조금만 연습해볼까요?</h2><p>{summary.practice.join(' · ') || '모두 잘 풀었어요! 다시 도전해서 다른 문제도 만나보세요.'}</p></div></div>
        <div className="result-actions"><button className="primary" onClick={share}>결과 공유하기 ↗</button><button className="secondary" onClick={start}>다시 도전하기 ↻</button></div><p className="notice" role="status">{notice}</p>
        {notice.startsWith('공유하지') && <textarea className="share-fallback" readOnly value={shareText} aria-label="복사할 결과 문구" onFocus={e => e.target.select()} />}
        <div className="review"><h2>내가 푼 문제 돌아보기 <span>{TOTAL}</span></h2>{responses.map((response, i) => <details key={response.question.id}><summary><span className={correct(response) ? 'right' : 'wrong'}>{correct(response) ? '✓' : '−'}</span><span>{i + 1}. {response.question.prompt}</span><span className="expand">＋</span></summary><div className="explanation"><p>내 답: {response.selected === null ? '모르겠어요' : response.question.choices[response.selected]}</p><p><strong>정답: {response.question.choices[response.question.answer]}</strong></p><p>{response.question.explanation}</p></div></details>)}</div>
      </section>}
    </main><footer><span>몇 학년? · 알아가는 재미</span><span>수학 편 / 초등 수와 연산</span></footer>
  </div>;
}
