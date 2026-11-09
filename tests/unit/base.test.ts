import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBase } from '../../src/lib/base';

test('base paths preserve queries, fragments and already resolved assets', () => {
  const base = '/resorts/coastal/';
  for (const [input, expected] of [
    ['/', '/resorts/coastal/'], ['/stays/cliff-villa/#room', '/resorts/coastal/stays/cliff-villa/#room'],
    ['/models/villa.glb?v=1', '/resorts/coastal/models/villa.glb?v=1'],
    ['/resorts/coastal/media/hero.webp', '/resorts/coastal/media/hero.webp'],
    ['https://example.com/a', 'https://example.com/a'], ['//cdn.example.com/a', '//cdn.example.com/a'],
    ['mailto:host@example.com', 'mailto:host@example.com'], ['#book', '#book'], ['page:stays', 'page:stays'],
  ]) assert.equal(withBase(input, base), expected);
  assert.equal(withBase('/media/hero.webp', '/'), '/media/hero.webp');
});
