import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MathText } from './MathText';

describe('textbook math notation', () => {
  it('draws the square-root bar over the full multi-digit number', () => {
    const html = renderToStaticMarkup(<MathText text="√144 = ?" />);
    expect(html).toContain('class="math-radical-sign"');
    expect(html).toContain('<span class="math-radicand">144</span>');
    expect(html).not.toContain('<msqrt>');
    expect(html).toContain('aria-label="루트 144 = ?"');
    expect(html).toContain('<mo>=</mo><mo>?</mo>');
  });
  it('renders numeric and variable exponents with native superscripts', () => {
    const html = renderToStaticMarkup(<MathText text="2^3 × 2^2 = 2^n" />);
    expect(html).toContain('<msup><mn>2</mn><mn>3</mn></msup>');
    expect(html).toContain('<msup><mn>2</mn><mi>n</mi></msup>');
    expect(html).not.toContain('^');
  });
  it('preserves Korean prose and ordinary math text', () => {
    expect(renderToStaticMarkup(<MathText text="12 + 3 = ?" />)).toBe('12 + 3 = ?');
    const html = renderToStaticMarkup(<MathText text="√는 음이 아닌 제곱근입니다. √49 = 7입니다." />);
    expect(html).toContain('√는 음이 아닌 제곱근입니다. ');
    expect(html).toContain('<span class="math-radicand">49</span>');
  });
  it('renders complete equations with italic variables and upright numbers', () => {
    const html = renderToStaticMarkup(<MathText text="3x + 2 = 17에서 x는?" />);
    expect(html).toContain('<mrow><mn>3</mn><mi>x</mi><mo>+</mo><mn>2</mn><mo>=</mo><mn>17</mn></mrow>');
    expect(html).toContain('에서 ');
    expect(html).toContain('<mrow><mi>x</mi></mrow>');
    expect(html).toContain('는?');
  });
  it('keeps powers attached to variables rather than coefficients', () => {
    const html = renderToStaticMarkup(<MathText text="y = 3x²에서 x = −3일 때 y는?" />);
    expect(html).toContain('<mi>y</mi><mo>=</mo><mn>3</mn><msup><mi>x</mi><mn>2</mn></msup>');
    expect(html).toContain('<mi>x</mi><mo>=</mo><mo>−</mo><mn>3</mn>');
  });
  it('renders both variables in simultaneous equations', () => {
    const html = renderToStaticMarkup(<MathText text="x + y = 7, x − y = 1에서 x는?" />);
    expect(html).toContain('<mi>x</mi><mo>+</mo><mi>y</mi>');
    expect(html).toContain('<mi>x</mi><mo>−</mo><mi>y</mi>');
  });

  it('stacks fractions and keeps addition denominators unchanged', () => {
    const html = renderToStaticMarkup(<MathText text="2/6 + 2/6 = 4/6" />);
    expect(html).toContain('<mfrac><mn>4</mn><mn>6</mn></mfrac>');
    expect(html).toContain('displaystyle="true"');
    expect(html).toContain('6분의 4');
    expect(html).not.toContain('<mo>/</mo>');
  });
  it('allows wrapping before equality without splitting a fraction', () => {
    const html = renderToStaticMarkup(<MathText text="2/3 ÷ 2 = 2/6 = 1/3입니다." />);
    expect(html.match(/<wbr\/?>/g)).toHaveLength(2);
    expect(html).toContain('<mfrac><mn>1</mn><mn>3</mn></mfrac>');
    expect(html).toContain('입니다.');
  });
  it('places a negative sign outside the fraction and uses integers for denominator one', () => {
    const html = renderToStaticMarkup(<MathText text="−2/3" />);
    expect(html).toContain('<mo>−</mo><mfrac><mn>2</mn><mn>3</mn></mfrac>');
    const integer = renderToStaticMarkup(<MathText text="2/1" />);
    expect(integer).toContain('<mn>2</mn>');
    expect(integer).not.toContain('<mfrac>');
  });

});


describe('trigonometric notation', () => {
  it.each(['sin A', 'sinA', 'cos A', 'tan A'])('keeps %s upright with an italic angle', text => {
    const html = renderToStaticMarkup(<MathText text={text} />);
    const fn = text.slice(0,3);
    expect(html).toContain(`<mi mathvariant="normal">${fn}</mi>`);
    expect(html).toContain('<mspace width="0.16em"></mspace><mi>A</mi>');
    expect(html).not.toContain('<mi>n</mi>');
    expect(html.match(/<math /g)).toHaveLength(1);
  });
  it('preserves Korean prose and fractions in a complete trig equation', () => {
    const html = renderToStaticMarkup(<MathText text="각 A에서 sin A = 3/5입니다. 맞은편 변 = 빗변 × sin A" />);
    expect(html).toContain('각 ');
    expect(html).toContain('입니다. 맞은편 변 ');
    expect(html).toContain('<mo>=</mo><mfrac><mn>3</mn><mn>5</mn></mfrac>');
    expect(html.match(/mathvariant="normal">sin/g)).toHaveLength(2);
  });
});


it('draws all three radicals in the reported mobile problem, including after the coefficient', () => {
  const html = renderToStaticMarkup(<MathText text="√27 + √147 = n√3일 때 n은?" />);
  expect(html.match(/class="math-radical-sign"/g)).toHaveLength(3);
  for (const n of [27,147,3]) expect(html).toContain(`<span class="math-radicand">${n}</span>`);
  expect(html).toContain('<mi>n</mi><mtext><span class="math-radical"');
  expect(html).toContain('aria-label="루트 27 + 루트 147 = n루트 3"');
});
