import { createElement, Fragment } from 'react';

// Native MathML draws the radical overbar across the entire number.
// Keep source questions as plain text so generation and grading stay unchanged.
export function MathText({ text }: { text: string }) {
  const tokens = text.split(/(√\d+|\d+\^(?:\d+|n))/g);
  return <>{tokens.map((token, index) => {
    if (/^√\d+$/.test(token)) {
      const number = token.slice(1);
      return <Fragment key={index}>{createElement('math', {
        className: 'math-notation', xmlns: 'http://www.w3.org/1998/Math/MathML',
        'aria-label': `루트 ${number}`,
      }, createElement('msqrt', null, createElement('mn', null, number)))}</Fragment>;
    }
    const power = token.match(/^(\d+)\^(\d+|n)$/);
    if (power) return <Fragment key={index}>{createElement('math', {
      className: 'math-notation', xmlns: 'http://www.w3.org/1998/Math/MathML',
      'aria-label': `${power[1]}의 ${power[2]}제곱`,
    }, createElement('msup', null, createElement('mn', null, power[1]),
      createElement(power[2] === 'n' ? 'mi' : 'mn', null, power[2])))}</Fragment>;
    return <Fragment key={index}>{token}</Fragment>;
  })}</>;
}
