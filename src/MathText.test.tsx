import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MathText } from './MathText';

describe('textbook math notation', () => {
  it('draws the square-root bar over the full multi-digit number', () => {
    const html = renderToStaticMarkup(<MathText text="√144 = ?" />);
    expect(html).toContain('<msqrt><mn>144</mn></msqrt>');
    expect(html).toContain('aria-label="루트 144"');
    expect(html).toContain(' = ?');
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
});
