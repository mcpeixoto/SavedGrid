const test = require('node:test');
const assert = require('node:assert');
const { cleanSettings, buildTiles, galleryOf, columnCount, makeDeck, DEFAULTS } = require('./view');

const posts = [
  { id: 'a', items: [{ type: 'image', src: 'a1' }, { type: 'video', src: 'a2' }, { type: 'image', src: 'a3' }] },
  { id: 'b', items: [{ type: 'video', src: 'b1' }] },
];
const srcs = (tiles) => tiles.map((t) => t.item.src);

test('split galleries gives one tile per item, in post order', () => {
  const t = buildTiles(posts, { split: true, filter: 'all', order: 'newest' });
  assert.deepStrictEqual(srcs(t), ['a1', 'a2', 'a3', 'b1']);
  assert.deepStrictEqual([t[1].p, t[1].i, t[1].of], [0, 1, 3]);
});

test('unsplit shows the first item of each post', () => {
  assert.deepStrictEqual(srcs(buildTiles(posts, { split: false, filter: 'all', order: 'newest' })), ['a1', 'b1']);
});

test('filter keeps one media type, and unsplit picks the first match', () => {
  assert.deepStrictEqual(srcs(buildTiles(posts, { split: true, filter: 'video', order: 'newest' })), ['a2', 'b1']);
  assert.deepStrictEqual(srcs(buildTiles(posts, { split: false, filter: 'video', order: 'newest' })), ['a2', 'b1']);
  assert.deepStrictEqual(srcs(buildTiles(posts, { split: true, filter: 'image', order: 'oldest' })), ['a3', 'a1']);
});

test('shuffle keeps every tile', () => {
  const t = buildTiles(posts, { split: true, filter: 'all', order: 'shuffle' }, () => 0);
  assert.deepStrictEqual(srcs(t).sort(), ['a1', 'a2', 'a3', 'b1']);
});

test('settings fall back to defaults when missing or invalid', () => {
  assert.deepStrictEqual(cleanSettings(null), DEFAULTS);
  const s = cleanSettings({ mode: 'wall', speed: 9999, gap: 'x', split: false, animation: 'explode', hideUi: 1 });
  assert.strictEqual(s.mode, 'wall');
  assert.strictEqual(s.speed, 400);
  assert.strictEqual(s.gap, DEFAULTS.gap);
  assert.strictEqual(s.split, false);
  assert.strictEqual(s.animation, 'random');
  assert.strictEqual(s.hideUi, true);
});

test('column count is auto from width unless set', () => {
  assert.strictEqual(columnCount(1500, 0), 5);
  assert.strictEqual(columnCount(300, 0), 2);
  assert.strictEqual(columnCount(1500, 3), 3);
});

test('deck shows every tile once before repeating and skips ones on screen', () => {
  const deck = makeDeck(4);
  const first = [deck.next(), deck.next(), deck.next(), deck.next()];
  assert.deepStrictEqual([...first].sort(), [0, 1, 2, 3]);
  const d2 = makeDeck(3);
  const seen = new Set([0, 1]);
  for (let k = 0; k < 6; k++) assert.strictEqual(d2.next(seen), 2);
  assert.strictEqual(makeDeck(2).next(new Set([0, 1])), null);
});

test('embedded players count as videos', () => {
  const withEmbed = [{ id: 'e', items: [{ type: 'image', src: 'e1' }, { type: 'embed', src: 'e2' }] }];
  assert.deepStrictEqual(srcs(buildTiles(withEmbed, { split: true, filter: 'video', order: 'newest' })), ['e2']);
  assert.deepStrictEqual(galleryOf(withEmbed[0], 'video'), [1]);
  assert.deepStrictEqual(galleryOf(withEmbed[0], 'all'), [0, 1]);
});

test('galleries slide in one tile by default, every few seconds', () => {
  assert.strictEqual(DEFAULTS.split, false);
  assert.strictEqual(DEFAULTS.galleryAuto, true);
  assert.strictEqual(cleanSettings({ galleryInterval: 0 }).galleryInterval, 1);
  assert.deepStrictEqual(galleryOf(posts[0], 'image'), [0, 2]);
});
