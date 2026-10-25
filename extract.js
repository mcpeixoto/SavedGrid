// Turns a Reddit post object (the `data` of a t3 thing) into the media the grid shows.
// Returns null for posts with nothing visual. Runs in Node (tests) and in the browser (lookup).
(function (root) {
  const unescape = (u) => (u || '').replace(/&amp;/g, '&');

  function previewImage(d) {
    const src = d.preview && d.preview.images && d.preview.images[0] && d.preview.images[0].source;
    return src ? { type: 'image', src: unescape(src.url), w: src.width, h: src.height } : null;
  }

  function extractMedia(post) {
    let d = post;
    if (d.crosspost_parent_list && d.crosspost_parent_list.length) d = d.crosspost_parent_list[0];
    const base = { id: post.name || 't3_' + post.id, permalink: 'https://www.reddit.com' + post.permalink };
    const poster = previewImage(d);

    if (d.is_gallery && d.media_metadata) {
      const order = d.gallery_data ? d.gallery_data.items.map((i) => i.media_id) : Object.keys(d.media_metadata);
      const items = order
        .map((k) => d.media_metadata[k])
        .filter((m) => m && m.status === 'valid' && m.s)
        .map((m) =>
          m.s.mp4
            ? { type: 'video', src: unescape(m.s.mp4), w: m.s.x, h: m.s.y }
            : { type: 'image', src: unescape(m.s.u || m.s.gif), w: m.s.x, h: m.s.y }
        );
      return items.length ? { ...base, items } : null;
    }

    const rv = (d.secure_media && d.secure_media.reddit_video) || (d.media && d.media.reddit_video) ||
      (d.preview && d.preview.reddit_video_preview);
    if (rv && rv.fallback_url) {
      return { ...base, items: [{ type: 'video', src: unescape(rv.fallback_url), hls: unescape(rv.hls_url), poster: poster && poster.src, w: rv.width, h: rv.height }] };
    }

    const url = unescape(d.url_overridden_by_dest || d.url);
    if (/\.gifv$/i.test(url)) {
      return { ...base, items: [{ type: 'video', src: url.replace(/\.gifv$/i, '.mp4'), poster: poster && poster.src, w: poster && poster.w, h: poster && poster.h }] };
    }
    if (/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url)) {
      return { ...base, items: [{ type: 'image', src: url, w: poster && poster.w, h: poster && poster.h }] };
    }
    return poster ? { ...base, items: [poster] } : null;
  }

  if (typeof module !== 'undefined') module.exports = { extractMedia };
  else root.extractMedia = extractMedia;
})(this);
