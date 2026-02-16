# StarSprout Reading

A kid-friendly progressive web app (PWA) for early reading games.

## Included game
- **Sight Word Splash**: a 10-round game where kids tap the matching sight word as quickly as they can.

## Run locally
From this folder, start any static server. For example:

```bash
python3 -m http.server 4173
```

Then open the local URL in your browser.

## PWA notes
- Includes `manifest.webmanifest` and `sw.js`.
- Install using your browser's install prompt/button.
- Works offline after first load thanks to service worker caching.
