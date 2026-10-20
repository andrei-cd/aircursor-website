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
  img/             App icons, favicon, Apple touch icon
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

## Demo video

The landing page's demo is an animated SVG. To use a screen recording instead, replace the `svg` inside `.ac-demo__canvas` with:

```html
<video src="assets/video/aircursor-demo.mp4" poster="assets/video/aircursor-demo.jpg" autoplay muted loop playsinline></video>
```

Keep the 12:7 frame. The pause button works with the video too. An 8 to 12 second, 60 fps H.264 MP4 under 4 MB works well.
