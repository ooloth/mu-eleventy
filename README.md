## Getting Started

- [Want a more generic/detailed getting started guide?](https://www.11ty.dev/docs/getting-started/)

Or you can run [debug mode](https://www.11ty.dev/docs/debugging/) to see all the internals.

## Features

- Using [Eleventy v2.0](https://www.11ty.dev/blog/eleventy-v2/) with zero-JavaScript output.
  - Content is exclusively pre-rendered (this is a static site).
  - Can easily [deploy to a subfolder without changing any content](https://www.11ty.dev/docs/plugins/html-base/)
  - All URLs are decoupled from the content’s location on the file system.
  - Configure templates via the [Eleventy Data Cascade](https://www.11ty.dev/docs/data-cascade/)
- **Performance focused**: four-hundos Lighthouse score out of the box!
  - [View the Lighthouse report for the latest build](https://eleventy-base-blog.netlify.app/reports/lighthouse/) courtesy of the [Netlify Lighthouse plugin](https://github.com/netlify/netlify-plugin-lighthouse).
  - _0 Cumulative Layout Shift_
  - _0ms Total Blocking Time_
- Local development live reload provided by [Eleventy Dev Server](https://www.11ty.dev/docs/dev-server/).
- Content-driven [navigation menu](https://www.11ty.dev/docs/plugins/navigation/)
- [Image optimization](https://www.11ty.dev/docs/plugins/image/) via the `{% image %}` shortcode.
  - Zero-JavaScript output.
  - Support for modern image formats automatically (e.g. AVIF and WebP)
  - Prefers `<img>` markup if possible (single image format) but switches automatically to `<picture>` for multiple image formats.
  - Automated `<picture>` syntax markup with `srcset` and optional `sizes`
  - Includes `width`/`height` attributes to avoid [content layout shift](https://web.dev/cls/).
  - Includes `loading="lazy"` for native lazy loading without JavaScript.
  - Includes [`decoding="async"`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding)
  - Images can be co-located with blog post files.
  - View the [Image plugin source code](https://github.com/11ty/eleventy-base-blog/blob/main/eleventy.config.images.js)
- Per page CSS bundles [via `eleventy-plugin-bundle`](https://github.com/11ty/eleventy-plugin-bundle).
- Built-in [syntax highlighter](https://www.11ty.dev/docs/plugins/syntaxhighlight/) (zero-JavaScript output).
- Blog Posts
  - Draft posts: use `draft: true` to mark a blog post as a draft. Drafts are **only** included during `--serve`/`--watch` and are excluded from full builds. View the [Drafts plugin source code](https://github.com/11ty/eleventy-base-blog/blob/main/eleventy.config.drafts.js).
  - Automated next/previous links
  - Accessible deep links to headings
- Generated Pages
  - Home, Archive, and About pages.
  - [Feeds for Atom and JSON](https://www.11ty.dev/docs/plugins/rss/)
  - `sitemap.xml`
  - Zero-maintenance tag pages ([View on the Demo](https://eleventy-base-blog.netlify.app/tags/))
  - Content not found (404) page

## Deploy this to your own site

Deploy this Eleventy site in just a few clicks on these services:

- [Get your own Eleventy web site on Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/11ty/eleventy-base-blog)
- Read more about [Deploying an Eleventy project](https://www.11ty.dev/docs/deployment/) to the web.

### Implementation Notes

- The `public` folder in your input directory will be copied to the output folder (via `addPassthroughCopy` in the `eleventy.config.js` file). This means `./public/css/*` will live at `./_site/css/*` after your build completes.

If your site enforces a Content Security Policy (as public-facing sites should), either, in `base.njk`, disable

```html
<style>
  {% getBundle "css" %}
</style>
```

and enable

```html
<link rel="stylesheet" href="{% getBundleFileUrl "css" %}">
```

or configure the server with the CSP directive `style-src: 'unsafe-inline'` (which is less secure).
