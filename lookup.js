// Runs on reddit.com, from the Saved Grid bookmarklet or pasted (after extract.js) into the DevTools console.
// It looks up media for your saved posts using your own login, then hands them to the grid page.
(() => {
  if (document.getElementById('savedgrid-box')) return;
  const gridUrl = typeof SAVEDGRID_URL !== 'undefined' ? SAVEDGRID_URL : 'https://mcpeixoto.github.io/SavedGrid/';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = document.createElement('div');
  box.id = 'savedgrid-box';
  box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;background:#111;color:#eee;padding:14px;border-radius:8px;font:14px system-ui;max-width:320px;box-shadow:0 4px 20px #0008';
  box.innerHTML = '<b>Saved Grid lookup</b><p style="margin:8px 0">Pick saved_posts.csv from your export, or use your live saved list (newest 1000 only).</p>' +
    '<input type="file" accept=".csv"><br><br><button>Use live saved list</button> <button>Close</button><p class="s" style="margin:8px 0 0;color:#aaa"></p>';
  document.body.append(box);
  const [file] = box.querySelectorAll('input'), [liveBtn, closeBtn] = box.querySelectorAll('button'), s = box.querySelector('.s');
  closeBtn.onclick = () => box.remove();

  async function getJson(url) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fetch(url, { credentials: 'include' });
      if (r.ok) return r.json();
      if (r.status === 429) { s.textContent = 'Rate limited, waiting…'; await sleep(10000); continue; }
      throw new Error(url + ' -> ' + r.status);
    }
    throw new Error('Gave up after rate limits');
  }

  function save(things, source) {
    const data = { generated: new Date().toISOString(), source, total: things.length, posts: things.filter((t) => t.kind === 't3').map((t) => extractMedia(t.data)).filter(Boolean) };
    s.textContent = `Done: ${data.posts.length} posts with media (of ${things.length}).` +
      (source === 'live' && things.length >= 1000 ? ' Reddit stops around 1000; pick your export CSV to get the rest.' : '');
    // The grid opens in a new tab and asks for the posts once it has loaded; a click is needed so the tab isn't blocked as a popup.
    const open = Object.assign(document.createElement('button'), { textContent: 'Open grid' });
    const dl = Object.assign(document.createElement('button'), { textContent: 'Download media.json' });
    open.style.cssText = 'background:#ff4500;color:#fff;border:0;padding:6px 12px;border-radius:6px;font-weight:600;cursor:pointer';
    s.after(document.createElement('br'), open, ' ', dl);
    const gridOrigin = new URL(gridUrl).origin;
    window.addEventListener('message', (e) => {
      if (e.origin === gridOrigin && e.data === 'savedgrid-ready') e.source.postMessage({ type: 'savedgrid-posts', ...data }, gridOrigin);
    });
    open.onclick = () => window.open(gridUrl + '?receive', '_blank');
    dl.onclick = () => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'media.json' }).click();
    };
  }

  file.onchange = async () => {
    try {
      const rows = (await file.files[0].text()).trim().split(/\r?\n/).slice(1);
      const ids = rows.map((r) => r.split(',')[0].replace(/"/g, '').trim()).filter(Boolean);
      const things = [];
      for (let i = 0; i < ids.length; i += 100) {
        s.textContent = `Looking up ${Math.min(i + 100, ids.length)} / ${ids.length}…`;
        const batch = ids.slice(i, i + 100).map((id) => (id.startsWith('t3_') ? id : 't3_' + id));
        const res = await getJson('/api/info.json?raw_json=1&id=' + batch.join(','));
        const byId = new Map(res.data.children.map((c) => [c.data.name, c]));
        for (const id of batch) if (byId.has(id)) things.push(byId.get(id)); // keep export order
        await sleep(1000);
      }
      save(things, 'csv');
    } catch (e) { s.textContent = 'Error: ' + e.message; }
  };

  liveBtn.onclick = async () => {
    try {
      const me = await getJson('/api/me.json');
      const name = (me.data || me).name;
      const things = [], seen = new Set();
      // Posts only (saved comments would use up Reddit's ~1000-item cap). If the cap is hit, a second
      // sort order sometimes surfaces older saves; duplicates are dropped.
      for (const sort of ['new', 'top']) {
        let after = '';
        do {
          s.textContent = `Fetched ${things.length} saved posts…`;
          const res = await getJson(`/user/${name}/saved.json?raw_json=1&limit=100&type=links&sort=${sort}&after=${after}`);
          for (const c of res.data.children) if (!seen.has(c.data.name)) { seen.add(c.data.name); things.push(c); }
          after = res.data.after || '';
          await sleep(1000);
        } while (after);
        if (things.length < 1000) break;
      }
      save(things, 'live');
    } catch (e) { s.textContent = 'Error: ' + e.message; }
  };
})();
