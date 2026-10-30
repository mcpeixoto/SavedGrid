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

test('embedded video named after its clip plays the mp4, keeping the player as fallback', () => {
  const m = extractMedia({
    ...base, url: 'https://www.example-clips.com/watch/bravecalmotter',
    secure_media: { type: 'example-clips.com', oembed: { type: 'video', width: 640, height: 1138, thumbnail_url: 'https://media.example-clips.com/BraveCalmOtter-poster.jpg',
      html: '&lt;iframe src="https://www.example-clips.com/ifr/bravecalmotter" frameborder="0"&gt;&lt;/iframe&gt;' } },
  });
  assert.deepStrictEqual(m.items[0], { type: 'video', src: 'https://media.example-clips.com/BraveCalmOtter.mp4', poster: 'https://media.example-clips.com/BraveCalmOtter-poster.jpg',
    embed: 'https://www.example-clips.com/ifr/bravecalmotter', w: 640, h: 1138 });
});

test('embedded video without a named thumbnail uses the player', () => {
  const m = extractMedia({
    ...base, url: 'https://www.example-clips.com/watch/bravecalmotter',
    secure_media_embed: { content: '<iframe src="https://www.example-clips.com/ifr/bravecalmotter?a=1&amp;b=2"></iframe>' },
    secure_media: { oembed: { type: 'video', thumbnail_url: 'https://i.example-clips.com/i/bravecalmotter.jpg' } },
    preview: { images: [{ source: { url: 'https://preview.redd.it/p.jpg', width: 3, height: 4 } }] },
  });
  assert.strictEqual(m.items[0].type, 'embed');
  assert.strictEqual(m.items[0].src, 'https://www.example-clips.com/ifr/bravecalmotter?a=1&b=2');
  assert.strictEqual(m.items[0].poster, 'https://preview.redd.it/p.jpg');
  assert.deepStrictEqual([m.items[0].w, m.items[0].h], [3, 4]);
});

test('reddit-hosted preview video still wins over the embedded player', () => {
  const m = extractMedia({
    ...base, secure_media: { oembed: { type: 'video', html: '<iframe src="https://x.example/ifr/a"></iframe>' } },
    preview: { reddit_video_preview: { fallback_url: 'https://v.redd.it/q/DASH_480.mp4' } },
  });
  assert.strictEqual(m.items[0].src, 'https://v.redd.it/q/DASH_480.mp4');
});

test('mergePosts keeps newer first and older extras after', () => {
  const { mergePosts } = require('./extract');
  const m = mergePosts([{ id: 'b' }, { id: 'a' }], [{ id: 'a' }, { id: 'z' }]);
  assert.deepStrictEqual(m.map((p) => p.id), ['b', 'a', 'z']);
  assert.deepStrictEqual(mergePosts([{ id: 'x' }], null).map((p) => p.id), ['x']);
});
