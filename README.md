<div align="center">

# Saved Grid

**Your Reddit saved posts as one endless wall of pictures and looping videos.**

No titles, no comments, no feed. Just the media you saved, laid out in a masonry grid that runs entirely on your own machine.

[![CI](https://github.com/mcpeixoto/SavedGrid/actions/workflows/ci.yml/badge.svg)](https://github.com/mcpeixoto/SavedGrid/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Buy me a coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-ffdd00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/mcpeixoto)

![Saved Grid on desktop](docs/grid.jpg)

</div>

## Features

- **Masonry grid** that keeps each image's real shape, newest saves at the top
- **Videos autoplay muted and loop**, but only while on screen, so hundreds of tiles stay smooth
- **Galleries** show a `1/3` badge; open one and step through with ← →
- **Lightbox** with sound on for videos and a link back to the original post
- **Gets past Reddit's 1000-item cap** by reading your full saved list from Reddit's data export
- **Private by design**: no server, no account, no tracking. Your data never leaves your computer
- **Zero dependencies**: one HTML file, two small scripts, nothing to install or build

| Lightbox | Phone |
|---|---|
| ![Lightbox view](docs/lightbox.jpg) | ![Grid on a phone](docs/mobile.jpg) |

<sub>Screenshots use the bundled demo data (photos from [Lorem Picsum](https://picsum.photos)).</sub>

## Try the demo

```bash
git clone https://github.com/mcpeixoto/SavedGrid.git
cd SavedGrid
python3 -m http.server 8734
```

Open http://localhost:8734/?demo

## Use it with your own saved posts

### 1. Get your saved list (pick one)

- **Full list:** request your data at [reddit.com/settings/data-request](https://www.reddit.com/settings/data-request) (choose all time). Reddit emails a zip within a few days; you need the `saved_posts.csv` inside it.
- **Right now:** skip the export. The script can read your live saved list instead, but Reddit only returns the newest ~1000 items.

### 2. Turn it into `media.json`

1. Copy the lookup script:
   ```bash
   cat extract.js lookup.js | pbcopy        # macOS
   cat extract.js lookup.js | xclip -sel c  # Linux
   ```
2. Open [reddit.com](https://www.reddit.com) while logged in, open DevTools → Console, paste, press Enter.
3. In the panel that appears, pick `saved_posts.csv` or click **Use live saved list**.
4. Move the downloaded `media.json` into the `SavedGrid` folder.

The script runs in your own logged-in tab, asks Reddit for 100 posts per request, and pauses between requests to stay well inside rate limits.

### 3. Open the grid

```bash
python3 -m http.server 8734
```

Open http://localhost:8734. Click a tile to open it; ← → move between items, Esc closes.

## How it works

```
saved_posts.csv ──► lookup.js (in your reddit.com tab) ──► media.json ──► index.html
   post IDs            /api/info.json, 100 IDs per call       media URLs      the grid
```

- [`extract.js`](extract.js) turns one Reddit post into the media to show: images, Reddit-hosted videos, galleries, crossposts and imgur `.gifv` links. Text posts are skipped.
- [`lookup.js`](lookup.js) is the in-browser panel that fetches posts and saves `media.json`.
- [`index.html`](index.html) is the grid and lightbox.

## Limitations

- Media from hosts that block embedding, or need their own API key (for example some video sites), falls back to the post's thumbnail or is skipped.
- Reddit videos play without sound in the grid; open one to hear it.
- Deleted or removed posts can't be looked up and are left out.

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started. Good first contributions: support for another media host, keyboard shortcuts, or filters (images only, videos only, by subreddit).

## Support

If Saved Grid brought your saved posts back to life, you can [buy me a coffee](https://buymeacoffee.com/mcpeixoto) ☕

## License

[MIT](LICENSE)
