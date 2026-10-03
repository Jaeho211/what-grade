import { createElement, Fragment, type ReactNode } from 'react';

function expression(text: string): ReactNode[] {
  const tokens = text.match(/sin|cos|tan|\d+\/\d+|\d+(?:\.\d+)?|[abfgikxynA-Zθ]|√|\^|[²³]|[^\s]/g) ?? [];
  const nodes: ReactNode[] = [];
  const atom = (token: string) => createElement(/^[abfgikxynA-Zθ]$/.test(token) ? 'mi' : 'mn', null, token);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let node: ReactNode;
    if (/^(sin|cos|tan)$/.test(token)) {
      nodes.push(createElement('mi', { key: `${i}-function`, mathvariant: 'normal' }, token));
      nodes.push(createElement('mo', { key: `${i}-apply` }, '\u2061'));
      nodes.push(createElement('mspace', { key: `${i}-space`, width: '0.16em' }));
      continue;
    }
    if (/^\d+\/\d+$/.test(token)) {
      const [numerator, denominator] = token.split('/');
      node = denominator === '1' ? atom(numerator) : createElement('mfrac', null, atom(numerator), atom(denominator));
    } else if (token === '√' && /^\d/.test(tokens[i + 1] ?? '')) {
      // Some mobile math fonts omit native msqrt's radical glyph entirely.
      // Draw the sign and overbar explicitly, while retaining the MathML equation.
      const radicand = tokens[++i];
      node = createElement('mtext', null,
        createElement('span', { className: 'math-radical', 'aria-hidden': 'true' },
          createElement('svg', { className: 'math-radical-sign', viewBox: '0 0 20 40', xmlns: 'http://www.w3.org/2000/svg', focusable: 'false' },
            createElement('path', { d: 'M1 24 L6 21 L10 36 L18 2 L20 2', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' })),
          createElement('span', { className: 'math-radicand' }, radicand)));

    } else if (/^(?:\d|[abfgikxynA-Zθ])/.test(token)) {
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
  const parts = text.split(/((?:(?:sin|cos|tan)(?=\s*[A-Zxynθ])|[√\d.,abfgikxynA-Zθ(){}+−\-×÷=^²³?/ ])+)/g);
  return <>{parts.map((part, index) => {
    if (!/\d|sin|cos|tan|[abfgikxynA-Zθ^²³]/.test(part)) return <Fragment key={index}>{part.split('\n').map((line, i) => <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>)}</Fragment>;
    const leading = part.match(/^[., ]*/)![0];
    const trailing = part.match(/[., ]*$/)![0];
    const math = part.slice(leading.length, part.length - trailing.length);
    // Keep Korean particles with their mathematical subject; preserve word spacing.
    let suffix = parts[index + 1]?.match(/^[가-힣]+[.!?]?/)?.[0] ?? '';
    if (suffix) {
      parts[index + 1] = parts[index + 1].slice(suffix.length);
      if (!parts[index + 1] && /^[.!?]/.test(parts[index + 2] ?? '')) {
        suffix += parts[index + 2][0];
        parts[index + 2] = parts[index + 2].slice(1);
      }
    }
    const hasFraction = /\d+\/\d+/.test(math);
    // A fraction stays whole. Long fraction calculations can wrap before an equals sign.
    const segments = hasFraction || math.length > 24 ? math.split(/(?==)/) : [math];
    return <Fragment key={index}>{leading}{segments.map((segment, i) =>
      <Fragment key={i}>{i > 0 && <wbr />}<span className="math-unit">{createElement('math', {
        className: `math-notation${hasFraction ? ' math-fraction' : ''}`,
        xmlns: 'http://www.w3.org/1998/Math/MathML',
        ...(hasFraction ? { displaystyle: 'true' } : {}),
        'aria-label': segment.trim().replace(/(\d+)\/(\d+)/g, '$2분의 $1').replace(/√/g, '루트 ').replace(/\^/g, '의 ').replace(/²/g, '의 제곱').replace(/³/g, '의 세제곱'),
      }, createElement('mrow', null, ...expression(segment)))}{i === segments.length - 1 && suffix}</span></Fragment>
    )}{trailing}</Fragment>;
  })}</>;
}
