const test = require('node:test');
const assert = require('node:assert');
const { formatPrice, slugify, formatDate } = require('../lib/utils');

test('slugify helper creates url-safe slugs', () => {
  assert.strictEqual(slugify('Classic Oxford Shirt'), 'classic-oxford-shirt');
  assert.strictEqual(slugify('Winter wear / Jacket!'), 'winter-wear-jacket');
  assert.strictEqual(slugify(''), '');
});

test('formatPrice formats decimal prices into INR currency string', () => {
  const formatted = formatPrice(1299.5);
  assert.match(formatted, /1,299/);
});

test('formatDate formats dates into Indian regional formatting', () => {
  const date = new Date('2026-07-10T16:32:00Z');
  const formatted = formatDate(date);
  assert.match(formatted, /Jul|10|2026/);
});
