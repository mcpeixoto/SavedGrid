const test = require('node:test');
const assert = require('node:assert');
const { extractMedia } = require('./extract');

const base = { name: 't3_a', id: 'a', permalink: '/r/x/comments/a/t/' };

test('plain image', () => {
  const m = extractMedia({ ...base, url: 'https://i.redd.it/x.jpg' });
  assert.deepStrictEqual(m.items[0].type, 'image');
  assert.strictEqual(m.items[0].src, 'https://i.redd.it/x.jpg');
  assert.strictEqual(m.permalink, 'https://www.reddit.com/r/x/comments/a/t/');
});

test('reddit video uses fallback mp4', () => {
  const m = extractMedia({ ...base, url: 'https://v.redd.it/z', secure_media: { reddit_video: { fallback_url: 'https://v.redd.it/z/DASH_720.mp4?source=fallback', hls_url: 'h', width: 1, height: 2 } } });
  assert.strictEqual(m.items[0].type, 'video');
  assert.match(m.items[0].src, /DASH_720/);
});

test('gallery keeps order and unescapes', () => {
  const m = extractMedia({
    ...base, is_gallery: true,
    gallery_data: { items: [{ media_id: 'b' }, { media_id: 'a' }] },
    media_metadata: { a: { status: 'valid', s: { u: 'https://p/a.jpg?x=1&amp;y=2', x: 1, y: 1 } }, b: { status: 'valid', s: { u: 'https://p/b.jpg', x: 1, y: 1 } } },
  });
  assert.deepStrictEqual(m.items.map((i) => i.src), ['https://p/b.jpg', 'https://p/a.jpg?x=1&y=2']);
});

test('crosspost uses parent media', () => {
  const m = extractMedia({ ...base, url: '/r/x/comments/b', crosspost_parent_list: [{ url: 'https://i.redd.it/p.png' }] });
  assert.strictEqual(m.items[0].src, 'https://i.redd.it/p.png');
  assert.strictEqual(m.id, 't3_a');
});

test('gifv becomes mp4', () => {
  assert.strictEqual(extractMedia({ ...base, url: 'https://i.imgur.com/q.gifv' }).items[0].src, 'https://i.imgur.com/q.mp4');
});

test('text post is skipped', () => {
  assert.strictEqual(extractMedia({ ...base, url: 'https://www.reddit.com/r/x/comments/a/t/', is_self: true }), null);
});

test('mergePosts keeps newer first and older extras after', () => {
  const { mergePosts } = require('./extract');
  const m = mergePosts([{ id: 'b' }, { id: 'a' }], [{ id: 'a' }, { id: 'z' }]);
  assert.deepStrictEqual(m.map((p) => p.id), ['b', 'a', 'z']);
  assert.deepStrictEqual(mergePosts([{ id: 'x' }], null).map((p) => p.id), ['x']);
});
