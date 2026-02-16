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

## Deploy to GitHub Pages
1. Push this project to a GitHub repository.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` (or `master`) to trigger deployment via `.github/workflows/pages.yml`.
5. Open your live URL:
   - `https://<your-username>.github.io/<your-repo>/`

## Install on iPad
1. Open the live site in Safari on the iPad.
2. Tap `Share`.
3. Tap `Add to Home Screen`.
4. Launch it from the Home Screen like an app.
