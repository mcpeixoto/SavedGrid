// What the grid shows and how: settings, the list of tiles, and the order wall cells pick new media in.
// Runs in Node (tests) and in the browser (index.html).
(function (root) {
  const MODES = ['grid', 'scroll', 'wall', 'slideshow'];
  const ANIMATIONS = ['random', 'fade', 'zoom', 'flip', 'slide', 'blur', 'iris'];
  const DEFAULTS = {
    mode: 'grid', filter: 'all', order: 'newest', split: true,
    columns: 0, gap: 6, speed: 40,
    interval: 3, swapCount: 2, animation: 'random', animMs: 900, kenburns: true,
    hideUi: true,
  };
  const RANGES = { columns: [0, 10], gap: [0, 24], speed: [5, 400], interval: [1, 30], swapCount: [1, 12], animMs: [150, 3000] };
  const CHOICES = { mode: MODES, filter: ['all', 'image', 'video'], order: ['newest', 'oldest', 'shuffle'], animation: ANIMATIONS };

  // Saved settings come from localStorage, so anything unknown or out of range falls back to the default.
  function cleanSettings(saved) {
    const s = { ...DEFAULTS };
    if (!saved || typeof saved !== 'object') return s;
    for (const k of Object.keys(DEFAULTS)) {
      const v = saved[k];
      if (CHOICES[k]) { if (CHOICES[k].includes(v)) s[k] = v; }
      else if (RANGES[k]) { if (typeof v === 'number' && isFinite(v)) s[k] = Math.min(RANGES[k][1], Math.max(RANGES[k][0], v)); }
      else if (typeof v === 'boolean') s[k] = v;
    }
    return s;
  }

  function shuffle(list, rand) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // One tile per gallery item when split, otherwise one per post (its first item that passes the filter).
  function buildTiles(posts, { split, filter, order }, rand = Math.random) {
    const ok = (item) => filter === 'all' || item.type === filter;
    let tiles = [];
    posts.forEach((post, p) => {
      const items = post.items.map((item, i) => ({ p, i, item, of: post.items.length })).filter((t) => ok(t.item));
      tiles.push(...(split ? items : items.slice(0, 1)));
    });
    if (order === 'oldest') tiles.reverse();
    if (order === 'shuffle') shuffle(tiles, rand);
    return tiles;
  }

  function columnCount(width, columns) {
    return columns > 0 ? columns : Math.max(2, Math.round(width / 300));
  }

  // Deals tile indexes in a shuffled order so every tile shows once before any repeats, skipping ones already on screen.
  function makeDeck(n, rand = Math.random) {
    let order = [], pos = 0;
    const deal = () => { order = shuffle([...Array(n).keys()], rand); pos = 0; };
    deal();
    return {
      next(onScreen = new Set()) {
        for (let tries = 0; tries < 2 * n; tries++) {
          if (pos >= n) deal();
          const idx = order[pos++];
          if (!onScreen.has(idx)) return idx;
        }
        return null;
      },
    };
  }

  const api = { DEFAULTS, MODES, ANIMATIONS, RANGES, cleanSettings, buildTiles, columnCount, makeDeck };
  if (typeof module !== 'undefined') module.exports = api;
  else root.View = api;
})(this);
