const { DateTime } = require('luxon');
const markdownItAnchor = require('markdown-it-anchor');
const yaml = require('js-yaml');

const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const pluginPostCSS = require('eleventy-plugin-postcss');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginWebC = require('@11ty/eleventy-plugin-webc');

const { removeDrafts, removePrivate, removeScheduled, sortByParent } = require('./src/config/collections.js');

// const pluginImages = require('./src/config/plugin.images.js');

module.exports = function (config) {
  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/styles/` ends up in `_site/styles/`
  config.addPassthroughCopy({
    './public/': '/',
    './node_modules/prismjs/themes/prism-okaidia.css': '/styles/prism-okaidia.css',
  });

  // Run Eleventy when these files change:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  // Watch content images for the image pipeline.
  // eleventyConfig.addWatchTarget('content/**/*.{svg,webp,png,jpeg}');

  // Official plugins
  config.addPlugin(EleventyHtmlBasePlugin);
  config.addPlugin(pluginBundle);
  config.addPlugin(pluginRss);
  config.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  config.addPlugin(pluginWebC, {
    bundlePluginOptions: {}, // options passed to @11ty/eleventy-plugin-bundle
    components: 'src/_includes/components/**/*.webc', // glob to find no-import global components
    transformData: {}, // additional global data used in the Eleventy WebC transform
    useTransform: false, // adds an Eleventy WebC transform to process all HTML output
  });

  // Community plugins
  config.addPlugin(pluginPostCSS);

  // Local plugins
  // eleventyConfig.addPlugin(pluginImages);

  // Collections

  // Posts in reverse chronological order
  // TODO: in production, filter out posts without a past date
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('posts', collectionApi => {
    const posts = collectionApi
      .getFilteredByGlob('src/content/writing/**/*.md')
      .reverse()
      .filter(item => item.data.destination === 'blog');

    return removeScheduled(removeDrafts(posts));
  });

  // Notes in alphabetical order
  // TODO: in production, filter out private notes
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('notes', collectionApi => {
    const notes = collectionApi
      .getFilteredByGlob('src/content/writing/**/*.md')
      .filter(item => item.data.destination !== 'blog')
      .sort((a, b) => a.inputPath.localeCompare(b.inputPath));

    return sortByParent(removePrivate(notes));
  });

  // Timeline in descending order
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('timeline', collectionApi =>
    collectionApi
      .getFilteredByGlob('src/content/timeline/**/*.md')
      .sort((a, b) => b.inputPath.localeCompare(a.inputPath)),
  );

  // Pages
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('pages', collectionApi =>
    collectionApi.getFilteredByGlob(['src/content/pages/**/*.md', 'src/pages/**/*.webc']),
  );

  // Data extensions
  config.addDataExtension('yaml', contents => yaml.load(contents));

  // Extensions

  // See: https://www.11ty.dev/docs/languages/custom/#aliasing-an-existing-template-language
  // See: https://gist.github.com/zachleat/b274ee939759b032bc320be1a03704a2
  // eleventyConfig.addExtension(['11ty.ts', '11ty.tsx'], {
  // key: '11ty.js',
  // });

  // Filters
  config.addFilter('readableDate', (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || 'America/Toronto' }).toFormat(format || 'DD');
  });

  config.addFilter('htmlDateString', dateObj => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  config.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) return [];
    if (n < 0) return array.slice(n);
    return array.slice(0, n);
  });

  // Return the smallest number argument
  config.addFilter('min', (...numbers) => Math.min.apply(null, numbers));

  // Return all the tags used in a collection
  config.addFilter('getAllTags', collection => {
    let tagSet = new Set();
    for (let item of collection) {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet);
  });

  config.addFilter('filterTagList', tags =>
    (tags || []).filter(tag => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1),
  );

  // Customize Markdown library settings:
  config.amendLibrary('md', mdLib => {
    mdLib.use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: 'after',
        class: 'header-anchor',
        symbol: '#',
        ariaHidden: false,
      }),
      level: [1, 2, 3, 4],
      slugify: config.getFilter('slugify'),
    });
  });

  // Features to make your build faster (when you need them)

  // If your passthrough copy gets heavy and cumbersome, add this line
  // to emulate the file copy on the dev server. Learn more:
  // https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

  // eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: 'njk',

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: 'njk',

    // These are all optional:
    dir: {
      input: 'src', // default: "."
      includes: '_includes', // relative to input dir
      data: '_data', // relative to input dir
      layouts: '_includes/layouts', // relative to input dir
      output: '_site', // relative to root
    },

    // -----------------------------------------------------------------
    // Optional items:
    // -----------------------------------------------------------------

    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

    // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
    // it will transform any absolute URLs in your HTML to include this
    // folder name and does **not** affect where things go in the output folder.
    pathPrefix: '/',
  };
};
