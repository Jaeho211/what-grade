import { createElement, Fragment, type ReactNode } from 'react';

function expression(text: string): ReactNode[] {
  const tokens = text.match(/\d+\/\d+|\d+(?:\.\d+)?|[xyn]|√|\^|[²³]|[^\s]/g) ?? [];
  const nodes: ReactNode[] = [];
  const atom = (token: string) => createElement(/^[xyn]$/.test(token) ? 'mi' : 'mn', null, token);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let node: ReactNode;
    if (/^\d+\/\d+$/.test(token)) {
      const [numerator, denominator] = token.split('/');
      node = denominator === '1' ? atom(numerator) : createElement('mfrac', null, atom(numerator), atom(denominator));
    } else if (token === '√' && /^\d/.test(tokens[i + 1] ?? '')) {
      node = createElement('msqrt', null, atom(tokens[++i]));
    } else if (/^(?:\d|[xyn])/.test(token)) {
      node = atom(token);
    } else {
      nodes.push(createElement('mo', { key: i }, token === '-' ? '−' : token));
      continue;
    }
    const exponent = tokens[i + 1];
    if (exponent === '^' && tokens[i + 2]) {
      node = createElement('msup', null, node, atom(tokens[i + 2]));
      i += 2;
    } else if (exponent === '²' || exponent === '³') {
      node = createElement('msup', null, node, atom(exponent === '²' ? '2' : '3'));
      i++;
    }
    nodes.push(createElement(Fragment, { key: i }, node));
  }
  return nodes;
}

// Render whole mathematical runs, while preserving the surrounding Korean prose.
// Single-character MathML identifiers use a mathematical italic font; numbers stay upright.
export function MathText({ text }: { text: string }) {
  const parts = text.split(/([√\d.xyn()+−\-×÷=^²³?/ ]+)/g);
  return <>{parts.map((part, index) => {
    if (!/[xyn^²³]|√\d|\d+\/\d+/.test(part)) return <Fragment key={index}>{part}</Fragment>;
    const leading = part.match(/^[., ]*/)![0];
    const trailing = part.match(/[., ]*$/)![0];
    const math = part.slice(leading.length, part.length - trailing.length);
    const hasFraction = /\d+\/\d+/.test(math);
    // A fraction stays whole. Long fraction calculations can wrap before an equals sign.
    const segments = hasFraction ? math.split(/(?==)/) : [math];
    return <Fragment key={index}>{leading}{segments.map((segment, i) =>
      <Fragment key={i}>{i > 0 && <wbr />}{createElement('math', {
        className: `math-notation${hasFraction ? ' math-fraction' : ''}`,
        xmlns: 'http://www.w3.org/1998/Math/MathML',
        ...(hasFraction ? { displaystyle: 'true' } : {}),
        'aria-label': segment.trim().replace(/(\d+)\/(\d+)/g, '$2분의 $1').replace(/√/g, '루트 ').replace(/\^/g, '의 ').replace(/²/g, '의 제곱').replace(/³/g, '의 세제곱'),
      }, createElement('mrow', null, ...expression(segment)))}</Fragment>
    )}{trailing}</Fragment>;
  })}</>;
}
