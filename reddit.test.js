const test = require('node:test');
const assert = require('node:assert');
const { authorizeUrl, parseCallback, fetchSaved, fetchByIds, idsFromCsv } = require('./reddit');

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const listing = (names, after = null) => ({ data: { after, children: names.map((n) => ({ kind: 't3', data: { name: n } })) } });

test('authorize URL asks for implicit grant with read-only scopes', () => {
  const u = new URL(authorizeUrl({ clientId: 'abc', redirectUri: 'https://x.io/SavedGrid/', state: 's1' }));
  assert.strictEqual(u.origin + u.pathname, 'https://www.reddit.com/api/v1/authorize');
  assert.strictEqual(u.searchParams.get('response_type'), 'token');
  assert.strictEqual(u.searchParams.get('scope'), 'identity history');
  assert.strictEqual(u.searchParams.get('redirect_uri'), 'https://x.io/SavedGrid/');
});

test('callback parsing', () => {
  assert.strictEqual(parseCallback('', 's'), null);
  assert.deepStrictEqual(parseCallback('#access_token=t&state=s&expires_in=3600', 's', 1000), { token: 't', expiresAt: 3601000 });
  assert.deepStrictEqual(parseCallback('#access_token=t&state=evil', 's'), { error: 'state_mismatch' });
  assert.deepStrictEqual(parseCallback('#error=access_denied&state=s', 's'), { error: 'access_denied' });
});

test('fetchSaved pages until after is empty and sends bearer token', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push(url);
    assert.strictEqual(opts.headers.Authorization, 'bearer tok');
    if (url.endsWith('/api/v1/me')) return json({ name: 'someone' });
    return url.includes('after=t3_b') ? json(listing(['t3_c'])) : json(listing(['t3_a', 't3_b'], 't3_b'));
  };
  const pages = [];
  await fetchSaved('tok', (p) => pages.push(p.map((d) => d.name)), { fetchImpl, delay: 0 });
  assert.deepStrictEqual(pages, [['t3_a', 't3_b'], ['t3_c']]);
  assert.match(calls[1], /\/user\/someone\/saved\?/);
});

test('fetchByIds batches 100 and keeps export order', async () => {
  const ids = Array.from({ length: 150 }, (_, i) => 'p' + i);
  const fetchImpl = async (url) => {
    const names = new URL(url).searchParams.get('id').split(',');
    return json(listing([...names].reverse())); // Reddit may return a different order
  };
  const pages = [];
  await fetchByIds('tok', ids, (p) => pages.push(p.map((d) => d.name)), { fetchImpl, delay: 0 });
  assert.strictEqual(pages.length, 2);
  assert.strictEqual(pages[0][0], 't3_p0');
  assert.strictEqual(pages[1].length, 50);
});

test('expired token is reported', async () => {
  await assert.rejects(fetchSaved('tok', () => {}, { fetchImpl: async () => json({}, 401) }), (e) => e.expired === true);
});

test('ids from export CSV', () => {
  assert.deepStrictEqual(idsFromCsv('id,permalink\nabc,https://x\r\n"def",https://y\n'), ['abc', 'def']);
});
