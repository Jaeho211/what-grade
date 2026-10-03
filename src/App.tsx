import { MathText } from './MathText';
import { createRoundClock, formatTime, QUESTION_SECONDS } from './round-clock';
import { useCallback, useEffect, useRef, useState } from 'react';
import { correct, nextQuestion, result, TOTAL, type Question, type Response } from './quiz';

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [responses, setResponses] = useState<Response[]>([]);
  const [question, setQuestion] = useState<Question>();
  const [remaining, setRemaining] = useState(QUESTION_SECONDS);
  const [expired, setExpired] = useState(false);
  const clock = useRef<ReturnType<typeof createRoundClock> | null>(null);
  const activeQuestionId = useRef<string | null>(null);
  const transition = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, question]);
  function start() {
    if (transition.current) clearTimeout(transition.current);
    const first = nextQuestion([]);
    activeQuestionId.current = first?.id ?? null;
    setResponses([]); setQuestion(first); setNotice(''); setExpired(false);
    clock.current = createRoundClock(); setRemaining(QUESTION_SECONDS); setScreen('quiz');
  }
  const submit = useCallback((answer: number | null) => {
    if (!question || !clock.current || activeQuestionId.current !== question.id) return;
    const timing = clock.current.settle(answer);
    if (!timing) return;
    const updated = [...responses, { question, ...timing }];
    const advance = () => {
      setResponses(updated); setExpired(false);
      if (updated.length === TOTAL) { activeQuestionId.current = null; clock.current = null; setScreen('result'); }
      else {
        const next = nextQuestion(updated);
        activeQuestionId.current = next?.id ?? null;
        clock.current = createRoundClock(); setRemaining(QUESTION_SECONDS); setQuestion(next);
      }
    };
    if (timing.timedOut) {
      setRemaining(0); setExpired(true);
      transition.current = setTimeout(advance, 800);
    } else advance();
  }, [question, responses]);
  useEffect(() => {
    if (screen !== 'quiz' || expired) return;
    const tick = () => {
      const seconds = clock.current?.remaining() ?? 0;
      setRemaining(seconds);
      if (seconds === 0) submit(null);
    };
    const timer = setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    tick();
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [screen, question, expired, submit]);
  useEffect(() => () => { if (transition.current) clearTimeout(transition.current); }, []);
  const summary = result(responses);
  const shareText = `나의 수학 나이는 ${summary.label}! 10문제 중 ${summary.score}개 정답 · ${formatTime(summary.elapsedMs)}. 당신은 몇 학년? 도전하기: ${window.location.origin}${window.location.pathname}`;
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
        <section className="intro-copy"><span className="eyebrow">20-SECOND CHALLENGE · 수학 편</span>
          <h1 ref={heading} tabIndex={-1}>당신의 수학 나이는<br /><span>몇 학년?</span></h1>
          <p className="lead">분명 배웠는데, 20초 안에 풀 수 있을까?<br />10문제로 나의 수학 나이를 확인해보세요.</p>
          <div className="chips"><span>✦ 초등 1학년~중3</span><span>◷ 문제마다 20초</span><span>↗ 로그인 없이</span></div>
          <button className="primary start" onClick={start}>도전 시작 <span>→</span></button>
          <p className="fine">보기를 누르면 답이 확정돼요. 준비되면 도전!</p>
        </section>
        <section className="illustration" aria-label="수학 노트 그림"><div className="orbit one">÷</div><div className="orbit two">＋</div><div className="orbit three">×</div><div className="notebook"><div className="note-top">TODAY’S LITTLE CHALLENGE <span>✦</span></div><div className="note-question">나의 수학 감각은?</div><div className="equation">3 × 4 = <span>?</span></div><div className="note-lines"><i /><i /><i /></div><div className="note-bottom"><span>20초 안에 풀어보세요</span><span>↗</span></div></div><div className="sticker">딱 10문제!</div></section>
        <section className="how"><div><b>01</b><span>빠르게 풀고</span><p>내 답에 맞춰 달라지는 문제</p></div><div><b>02</b><span>수학 나이 확인</span><p>나는 과연 몇 학년일까?</p></div><div><b>03</b><span>친구에게 도전장</span><p>친구는 몇 학년으로 나올까?</p></div></section>
      </div>}
      {screen === 'quiz' && question && <section className="quiz panel">
        <div className="quiz-top"><span className="eyebrow">나의 수학 나이 도전 중</span><span className="counter">{responses.length + 1} <span>/ {TOTAL}</span></span></div>
        <div className="progress" role="progressbar" aria-label="답변 완료" aria-valuenow={responses.length} aria-valuemin={0} aria-valuemax={TOTAL}><div style={{ width: `${responses.length / TOTAL * 100}%` }} /></div>
        <div className={`timer ${remaining <= 5 ? 'urgent' : ''}`}>
          <div className="timer-heading"><span>남은 시간</span><strong role="timer" aria-label={`남은 시간 ${remaining}초`}>{remaining}초</strong></div>
          <div className="timer-track"><div style={{ width: `${remaining / QUESTION_SECONDS * 100}%` }} /></div>
        </div>
        {expired && <p className="timeout-message" role="status">앗, 시간 끝! 다음으로 넘어가요.</p>}
        <span className="question-label">QUESTION {String(responses.length + 1).padStart(2, '0')}</span>
        <h1 className="question" ref={heading} tabIndex={-1}><MathText text={question.prompt} /></h1>
        <p className="question-help" id="choice-help">보기를 누르면 바로 다음 문제로 넘어가요.</p>
        <div className="choices" role="group" aria-label="답 선택" aria-describedby="choice-help">{question.choices.map((choice, i) => <button key={`${question.id}-${i}`} className="choice" disabled={expired} onClick={() => submit(i)}><span className="choice-number">{i + 1}</span><MathText text={choice} /></button>)}</div>
        <p className="fine center">시간이 끝나면 자동으로 넘어가요. 정답은 끝나고 확인!</p>
      </section>}
      {screen === 'result' && <section className="results">
        <div className="result-hero"><span className="eyebrow">YOUR MATH MOMENT</span><div className="result-icon">✦</div><h1 ref={heading} tabIndex={-1}>당신의 수학 나이는</h1><p className="grade">{summary.label}</p><p className="lead">{summary.grade === 9 ? '중3까지 도달! 수학 감각 최고예요 🏆' : summary.grade >= 7 ? '중학교 수학도 거뜬하네요 😎' : summary.grade >= 5 ? '수학 감각, 아직 살아있네요 😎' : summary.grade >= 3 ? '오랜만인데 꽤 잘 풀었는데요! ✨' : '한 번 더! 이번엔 올라갈 수 있어요 🚀'}</p><span className="score">10문제 중 {summary.score}개 정답 · {formatTime(summary.elapsedMs)}</span><p className="fine">재미로 보는 수학 나이예요. 실제 학년이나 수학 능력을 의미하지 않아요.</p></div>
        {summary.timeouts > 0 && <p className="fine center">시간 초과 {summary.timeouts}문제 · 이번엔 조금 더 빠르게!</p>}
        <div className="result-actions"><button className="primary" onClick={start}>{summary.grade === 9 ? '중3 한 번 더 도전! ↻' : '한 학년 더 올라갈까? ↻'}</button><button className="secondary" onClick={share}>친구에게 도전장 보내기 ↗</button></div><p className="notice" role="status">{notice}</p>
        {notice.startsWith('공유하지') && <textarea className="share-fallback" readOnly value={shareText} aria-label="복사할 결과 문구" onFocus={e => e.target.select()} />}
        <details className="review"><summary className="review-heading">정답 확인 <span>{TOTAL}문제</span></summary><div>{responses.map((response, i) => <details key={response.question.id}><summary><span className={correct(response) ? 'right' : 'wrong'}>{correct(response) ? '✓' : '−'}</span><span>{i + 1}. <MathText text={response.question.prompt} /></span><span className="expand">＋</span></summary><div className="explanation"><p>내 답: {response.selected === null ? (response.timedOut ? '시간 초과' : '넘어가기') : <MathText text={response.question.choices[response.selected]} />}</p><p><strong>정답: <MathText text={response.question.choices[response.question.answer]} /></strong></p><p><MathText text={response.question.explanation} /></p></div></details>)}</div></details>
      </section>}
    </main><footer><span>몇 학년? · 도전하는 재미</span><span>수학 편 / 초등~중학교</span></footer>
  </div>;
}
