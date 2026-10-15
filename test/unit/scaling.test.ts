// The same cases as the recipe server's test_scale.py (trmnl-recipe-book). If one
// changes, change both, or the app and the panel will show different amounts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scaleIngredient } from '../../src/app/shared/scaling.ts';

const CASES: [string, string][] = [
  ['2 קילו אסאדו', '4 קילו אסאדו'],
  ['1/2 כפית סודה', '1 כפית סודה'],
  ['¹/₂ כוס קמח', '1 כוס קמח'], // superscript, from PDFs
  ['½ כוס חלב', '1 כוס חלב'], // vulgar fraction
  ['240 מל רוטב', '480 מל רוטב'],
  ['1 1/2 כפיות טימין', '3 כפיות טימין'], // mixed number
  ['2-3 שיני שום', '4-6 שיני שום'], // range: both ends scale
  ['1/4 כוס (60 מל) מים', '1/2 כוס (120 מל) מים'], // two amounts on one line
  ['0.5 ליטר חלב', '1 ליטר חלב'],
  ['3/4 כוס סוכר', '1 1/2 כוס סוכר'], // fraction -> mixed
  ['1/3 כוס שמן', '2/3 כוס שמן'],
  ['כף מלח גס', '×2 כף מלח גס'], // nothing to multiply
];

for (const [input, expected] of CASES) {
  test(`x2: ${input}`, () => assert.equal(scaleIngredient(input, 2), expected));
}

test('x1 leaves every line exactly as written', () => {
  for (const [input] of CASES) assert.equal(scaleIngredient(input, 1), input);
});
