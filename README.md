# aircursor-website

The website for AirCursor, the app that turns iPad and Apple Pencil into a drawing tablet and trackpad for the Mac. It's plain HTML, CSS and JavaScript, with no build step.

## Pages

| Page | File |
| --- | --- |
| Landing | `index.html` |
| Support | `support/index.html` |
| Privacy Policy | `privacy/index.html` |
| Feedback | `feedback/index.html` |
| Not found | `404.html` |

Links are relative, so the site works on a custom domain and at `andrei-cd.github.io/aircursor-website/`.

## Layout

```
assets/
  css/tokens.css   Design tokens (colors, spacing, radii, shadows). Light by default, dark follows the system.
  css/site.css     Components and page layouts, class prefix ac-
  js/site.js       Mobile menu, demo pause, support search, privacy contents, feedback form
  img/icons.svg    Line icon sprite, used with <use href="…/icons.svg#name">
  img/             App icons, favicon, Apple touch icon, og-image.jpg (link previews)
  img/screens/     App screenshots, a light and a dark WebP of each
  video/           The landing page's demo loop and its poster
media/             Not deployed: the demo GIF for sharing, and the sources that make the video
```

Every page works without JavaScript. The script only adds polish.

## Preview locally

Serve the folder rather than opening the files directly, because browsers block the icon sprite on `file://` URLs:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The site is configured for Cloudflare Pages. `scripts/build.sh` copies only the public site files into `dist/`, and `wrangler.jsonc` identifies that directory as the deployment output.

### Connect the private GitHub repository

1. In Cloudflare, open **Workers & Pages → Create → Pages → Import an existing Git repository**.
2. Connect GitHub and grant Cloudflare access to this repository.
3. Use these build settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `./scripts/build.sh` |
| Build output directory | `dist` |
| Root directory | `/` |

Cloudflare creates a preview deployment for pull requests and deploys production whenever `main` changes.

### Add the custom domain

After the first deployment, open the Pages project and choose **Custom domains → Set up a domain**. Add `aircursor.app` and follow Cloudflare's DNS prompts. Add `www.aircursor.app` separately if both hostnames should work.

### Build or deploy from the command line

Build the deployable site locally with:

```bash
./scripts/build.sh
```

If Wrangler is installed, deploy the generated output with:

```bash
npx wrangler pages deploy
```

The dashboard Git integration is the recommended deployment path; the command-line route is optional.

## Before launch

Replace these placeholders across the HTML files:

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `https://apps.apple.com/app/id0000000000` | Every page (Download buttons) | The App Store listing URL |
| `YOUR_FORM_ID` | `feedback/index.html` | The ID of the Formspree form |
| `hello@aircursor.app` | `feedback/index.html` (`data-mailto` and the link) | The support email |
| `privacy@aircursor.app` | `privacy/index.html` | The privacy contact email |

Also:

- Swap the text-only App Store button in the landing page's download section for Apple's official "Download on the App Store" badge.
- Have the privacy policy reviewed, and update its "Last updated" date when it changes.
- When the paid version ships, change the "Free on the App Store during launch" and "Free during launch" eyebrows on the landing page.
- The link-preview tags on the landing page (`og:url`, `og:image`) use `https://aircursor.app/`. Change them if the site launches on another domain.

## Screenshots

The screenshots in `assets/img/screens/` come from the real apps, using DEBUG-only launch arguments in the AirCursor Xcode project that swap in a canned, connected session. Nothing connects, and no real device names appear.

- **iPad:** run the iPad scheme in a Simulator with `-demoConnected` (add `-demoTabletMode` for Tablet mode, `-demoSettings` to open Settings, `-demoLandscape` to lay it out in landscape), then `xcrun simctl io booted screenshot`. A `-demoLandscape` screenshot comes out on its side; turn it a quarter turn counterclockwise.
- **Mac:** run the Mac app's binary with `-demoConnected` or `-demoWaiting`, plus `-demoMenu` for the menu bar menu, `-demoAppearance light` or `dark`, and `-demoSnapshot`, which prints the window as a base64 PNG and quits.

Each image has a light and a dark version, swapped by a `<picture>` element with a `prefers-color-scheme` source. The Settings sheet is cropped out of the full iPad screen, and window corners are rounded in the image itself.

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
