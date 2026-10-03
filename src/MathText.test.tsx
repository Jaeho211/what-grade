import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MathText } from './MathText';

describe('textbook math notation', () => {
  it('draws the square-root bar over the full multi-digit number', () => {
    const html = renderToStaticMarkup(<MathText text="√144 = ?" />);
    expect(html).toContain('<msqrt><mn>144</mn></msqrt>');
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
    expect(html).toContain('<msqrt><mn>49</mn></msqrt>');
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

});
