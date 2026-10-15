// Scale the amounts inside free-text ingredient lines ("2 קילו אסאדו", "½ כוס").
// A port of the recipe server's static/js/scale.js, which scaling.py mirrors for
// the panel. test/unit/scaling.test.ts holds this copy to the same cases as the
// server's test_scale.py, so the app and the panel never disagree on an amount.

// "¹/₂" appears in text lifted from PDFs; normalise to plain digits first.
const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const SUB: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const VULGAR: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5',
  '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

function normalise(text: string): string {
  let out = '';
  for (const ch of text) {
    out += SUP[ch] ?? SUB[ch] ?? VULGAR[ch] ?? ch;
  }
  return out;
}

/** Nearest tidy fraction: 0.75 reads as 3/4, and 0.33 as 1/3. */
export function pretty(value: number): string {
  if (!isFinite(value)) return String(value);
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));

  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const options = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8], [1, 6], [5, 6]];
  let best: number[] | null = null;
  let bestErr = 0.045; // tighter than this and 0.3 becomes "0.3"
  for (const [n, d] of options) {
    const err = Math.abs(frac - n / d);
    if (err < bestErr) {
      bestErr = err;
      best = [n, d];
    }
  }
  if (best) {
    const f = `${best[0]}/${best[1]}`;
    return whole ? `${whole} ${f}` : f;
  }
  return String(Math.round(rounded * 100) / 100);
}

// Mixed numbers first, then fractions, then plain numbers: in any other order
// "1 1/2" would match as "1" followed by "1/2".
const NUM = /(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:[.,]\d+)?)/g;

/**
 * The line with every amount multiplied by factor. A line with no number
 * ("כף מלח") gets a visible "×2" in front instead of being left silently wrong.
 */
export function scaleIngredient(text: string, factor: number): string {
  if (factor === 1) return text;
  const clean = normalise(text);
  NUM.lastIndex = 0;
  if (!NUM.test(clean)) return `×${factor} ${text}`;
  return clean.replace(NUM, (m, w, wn, wd, n, d, plain) => {
    let value: number;
    if (w !== undefined) value = parseInt(w, 10) + parseInt(wn, 10) / parseInt(wd, 10);
    else if (n !== undefined) value = parseInt(n, 10) / parseInt(d, 10);
    else value = parseFloat(String(plain).replace(',', '.'));
    return isFinite(value) ? pretty(value * factor) : m;
  });
}
