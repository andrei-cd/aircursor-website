# aircursor-website

The website for AirCursor, the app that turns iPad and Apple Pencil into a drawing tablet and trackpad for the Mac. It's plain HTML, CSS and JavaScript, with no build step. This repository contains only the website, not the app.

## Pages

| Page           | File                  |
| -------------- | --------------------- |
| Landing        | `index.html`          |
| Support        | `support/index.html`  |
| Privacy Policy | `privacy/index.html`  |
| Feedback       | `feedback/index.html` |
| Not found      | `404.html`            |

Links are relative, so the site works at any path as well as at the root of aircursor.app.

## Layout

```
assets/
  css/tokens.css   Design tokens (colors, spacing, radii, shadows). Light by default, dark follows the system.
  css/site.css     Components and page layouts, class prefix ac-
  js/site.js       Mobile menu, scroll reveals, demo pause, support search, privacy contents, feedback form
  img/icons.svg    Line icon sprite, used with <use href="…/icons.svg#name">
  img/             App icons, favicon, Apple touch icon, og-image.jpg (link previews)
  img/screens/     App screenshots, a light and a dark WebP of each
  video/           The landing page's demo loop and its poster
media/             Not deployed: the demo GIF for sharing, and the sources that make the video
```

Every page works without JavaScript. The script only adds polish. On the landing page, elements marked `data-reveal` fade up the first time they scroll into view (`data-reveal="zoom"` scales screenshots in instead). With reduced motion they show straight away, and in-page links scroll smoothly.

## Preview locally

Serve the folder rather than opening the files directly, because browsers block the icon sprite on `file://` URLs:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The site is live at aircursor.app on Cloudflare Pages, and every push to `main` redeploys it. `scripts/build.sh` copies only the public site files into `dist/`, and `wrangler.jsonc` identifies that directory as the deployment output.

| Setting                | Value                |
| ---------------------- | -------------------- |
| Production branch      | `main`               |
| Framework preset       | `None`               |
| Build command          | `./scripts/build.sh` |
| Build output directory | `dist`               |
| Root directory         | `/`                  |

To build the deployable site locally, run `./scripts/build.sh`.

## Screenshots

The screenshots in `assets/img/screens/` are captured from the real apps with canned demo data, so no real device names appear. Each image has a light and a dark version, swapped by a `<picture>` element with a `prefers-color-scheme` source. The Settings sheet is cropped out of the full iPad screen, and window corners are rounded in the image itself.

## Demo video

The landing page's demo is `assets/video/aircursor-demo.mp4`: an 8-second, 60 fps loop with `aircursor-demo.jpg` as its poster. It's rendered from `media/demo/demo.html`, which places the real iPad canvas screenshot (`ipad.png`, Tablet mode, dark) in front of an illustrated Mac and animates the Pencil, the cursor and the ink. The mapping follows Tablet mode: the Mac's 16:10 screen maps onto the iPad canvas with the aspect ratio matched.

To render it again, run these from the repository root. They need Google Chrome, Node 22 or later, and ffmpeg:

```bash
node media/demo/render.mjs "file://$PWD/media/demo/demo.html" /tmp/frames 1200 700 1.6 60 8
ffmpeg -framerate 60 -i /tmp/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 22 -movflags +faststart assets/video/aircursor-demo.mp4
ffmpeg -i /tmp/frames/f0285.png -q:v 3 assets/video/aircursor-demo.jpg
```

`media/aircursor-demo.gif` is the same loop at 720 px and 20 fps, for places that don't play video. `media/demo/og.html` renders `assets/img/og-image.jpg` the same way, with a single frame: `node media/demo/render.mjs "file://$PWD/media/demo/og.html" /tmp/og 1200 630 1 1 1 0`.

The pause button works with the video, and with reduced motion the video stops on the finished stroke. Keep the 12:7 frame.

## License

Copyright © 2026 Andrei Cruspero. All rights reserved.

The source code, text, and media in this repository, including the AirCursor name, icons, screenshots, and demo video, are published for reference only. No permission is granted to copy, modify, distribute, or reuse them without written permission.
