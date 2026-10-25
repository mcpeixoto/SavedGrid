# Contributing to Saved Grid

Thanks for helping out! Saved Grid is deliberately small: plain HTML and JavaScript, no build step, no dependencies. Please keep it that way.

## Getting started

```bash
git clone https://github.com/mcpeixoto/SavedGrid.git
cd SavedGrid
python3 -m http.server 8734   # then open http://localhost:8734/?demo
node --test                   # run the tests (Node 18+)
```

The `?demo` page uses `demo/media.json`, so you can work on the grid without a Reddit account.

## Where things live

| File | What it does |
|---|---|
| `extract.js` | Reddit post → media items. Most new-host support goes here. |
| `extract.test.js` | Tests for `extract.js`. Add one for every new case. |
| `lookup.js` | The panel pasted into the reddit.com console that builds `media.json`. |
| `index.html` | The grid and lightbox. |

## Pull requests

1. Open an issue first for anything bigger than a small fix, so we can agree on the approach.
2. Branch from `master`, keep the change focused, and add tests for `extract.js` changes.
3. Run `node --test` and check the demo page still works.
4. Describe what changed and how you tested it in the PR.

## Privacy rule

Never commit real Reddit data. `media.json` and `saved_posts.csv` are git-ignored; keep it that way, and use made-up or public sample data in tests and the demo.

## Code of conduct

Be kind and constructive. This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
