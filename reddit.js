// Reddit sign-in (OAuth implicit grant for an "installed app") and saved-post fetching.
// No secret is involved: the client ID is public and the token lives only in the browser tab.
(function (root) {
  const SCOPES = 'identity history';
  const API = 'https://oauth.reddit.com';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function authorizeUrl({ clientId, redirectUri, state }) {
    const q = new URLSearchParams({ client_id: clientId, response_type: 'token', state, redirect_uri: redirectUri, scope: SCOPES });
    return 'https://www.reddit.com/api/v1/authorize?' + q;
  }

  // Reddit redirects back with #access_token=…&state=…&expires_in=… (or #error=…).
  function parseCallback(hash, expectedState, now = Date.now()) {
    const p = new URLSearchParams((hash || '').replace(/^#/, ''));
    if (!p.has('access_token') && !p.has('error')) return null;
    if (p.get('state') !== expectedState) return { error: 'state_mismatch' };
    if (p.has('error')) return { error: p.get('error') };
    return { token: p.get('access_token'), expiresAt: now + Number(p.get('expires_in') || 3600) * 1000 };
  }

  async function get(token, path, fetchImpl = fetch) {
    for (let attempt = 0; attempt < 4; attempt++) {
      let r;
      try { r = await fetchImpl(API + path, { headers: { Authorization: 'bearer ' + token } }); }
      catch { throw new Error("Couldn't reach Reddit. Check your connection or ad blocker and try again."); }
      if (r.ok) return r.json();
      if (r.status === 401) throw Object.assign(new Error('Your Reddit sign-in expired. Sign in again.'), { expired: true });
      if (r.status === 429) { await sleep(10000); continue; }
      throw new Error('Reddit returned ' + r.status);
    }
    throw new Error('Reddit kept rate-limiting; try again in a minute.');
  }

  // Calls onPage(posts) for each page of up to 100 saved posts, newest first.
  async function fetchSaved(token, onPage, { fetchImpl = fetch, delay = 700 } = {}) {
    const me = await get(token, '/api/v1/me', fetchImpl);
    let after = '';
    do {
      const res = await get(token, `/user/${encodeURIComponent(me.name)}/saved?raw_json=1&limit=100&type=links&after=${after}`, fetchImpl);
      onPage(res.data.children.filter((c) => c.kind === 't3').map((c) => c.data));
      after = res.data.after || '';
      if (after) await sleep(delay);
    } while (after);
  }

  // Looks up posts by ID (e.g. from saved_posts.csv), 100 per request, keeping the given order.
  async function fetchByIds(token, ids, onPage, { fetchImpl = fetch, delay = 700 } = {}) {
    const names = ids.map((id) => (id.startsWith('t3_') ? id : 't3_' + id));
    for (let i = 0; i < names.length; i += 100) {
      const batch = names.slice(i, i + 100);
      const res = await get(token, '/api/info?raw_json=1&id=' + batch.join(','), fetchImpl);
      const byName = new Map(res.data.children.map((c) => [c.data.name, c.data]));
      onPage(batch.map((n) => byName.get(n)).filter(Boolean), { done: Math.min(i + 100, names.length), total: names.length });
      if (i + 100 < names.length) await sleep(delay);
    }
  }

  // saved_posts.csv from Reddit's data export: header row, then id,permalink.
  function idsFromCsv(text) {
    return text.trim().split(/\r?\n/).slice(1)
      .map((row) => row.split(',')[0].replace(/"/g, '').trim())
      .filter(Boolean);
  }

  const api = { authorizeUrl, parseCallback, fetchSaved, fetchByIds, idsFromCsv };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Reddit = api;
})(this);
