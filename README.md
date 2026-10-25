# Saved Grid

Your Reddit saved posts as a wall of pictures and muted, looping videos. Runs locally; nothing is published.

## 1. Get media.json

1. Build the console script: `cat extract.js lookup.js | pbcopy`
2. Open reddit.com (logged in), open DevTools → Console, paste, press Enter.
3. In the box that appears:
   - **Pick `saved_posts.csv`** from your Reddit data export (gets everything), or
   - **Use live saved list** (no export needed, but Reddit only returns the newest ~1000).
4. Move the downloaded `media.json` into this folder.

## 2. View the grid

```bash
python3 -m http.server 8734
```

Open http://localhost:8734. Click a tile to view it large (← → for gallery/next, Esc to close).

## Tests

```bash
node --test
```
