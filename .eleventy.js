const { DateTime } = require('luxon');
const markdownItAnchor = require('markdown-it-anchor');
const yaml = require('js-yaml');

const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const bundle = require('@11ty/eleventy-plugin-bundle');
const embedEverything = require('eleventy-plugin-embed-everything');
const postCSS = require('eleventy-plugin-postcss');
const rss = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const webC = require('@11ty/eleventy-plugin-webc');

const { removeDrafts, removePrivate, removeScheduled, sortByParent } = require('./src/config/collections.js');
const { image } = require('./src/config/shortcodes.js');

require('dotenv').config();

module.exports = function (config) {
  config.addPassthroughCopy({
    // Copy `public` folder contents to output folder (e.g .`./public/styles/` -> `_site/styles/`)
    './public/': '/',
    './node_modules/prismjs/themes/prism-okaidia.css': '/styles/prism-okaidia.css',
  });

  // Official plugins
  config.addPlugin(EleventyHtmlBasePlugin);
  config.addPlugin(bundle);
  config.addPlugin(rss);
  config.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  config.addPlugin(webC, {
    bundlePluginOptions: {}, // options passed to @11ty/eleventy-plugin-bundle
    components: 'src/_includes/components/**/*.webc', // glob to find no-import global components
    transformData: {}, // additional global data used in the Eleventy WebC transform
    useTransform: false, // adds an Eleventy WebC transform to process all HTML output
  });

  // Community plugins
  config.addPlugin(embedEverything, {
    youtube: {
      options: {
        // See: https://github.com/gfscott/eleventy-plugin-embed-everything/tree/main/packages/youtube#lite-youtube-embed
        lite: {
          thumbnailQuality: 'maxresdefault',
        },
      },
    },
  });
  config.addPlugin(postCSS);

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

    // Remove private notes AFTER sorting by parents to automatically remove all children of private parents as well
    return removePrivate(sortByParent(notes));
  });

  // Pages
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('pages', collectionApi => collectionApi.getFilteredByGlob('src/content/pages/**/*.md'));

  // Data extensions
  config.addDataExtension('yaml', contents => yaml.load(contents));

  // Extensions

  // See: https://www.11ty.dev/docs/languages/custom/#aliasing-an-existing-template-language
  // See: https://gist.github.com/zachleat/b274ee939759b032bc320be1a03704a2
  // eleventyConfig.addExtension(['11ty.ts', '11ty.tsx'], {
  // key: '11ty.js',
  // });

  // Filters
  config.addFilter('readableDate', (date, format, zone) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || 'America/Toronto' }).toFormat(format || 'DD');
  });

  config.addFilter('htmlDateString', date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Return true if item is in collection (at any ancestry level)
  config.addFilter('isPageInCollection', (page, collection) =>
    collection.some(item => item.url === page.url || (item.children || []).some(child => child.url === page.url)),
  );

  // Get the first `n` elements of a collection.
  // config.addFilter('head', (array, n) => {
  //   if (!Array.isArray(array) || array.length === 0) return [];
  //   if (n < 0) return array.slice(n);
  //   return array.slice(0, n);
  // });

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

  // config.addFilter('filterTagList', tags =>
  //   (tags || []).filter(tag => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1),
  // );

  // Customize Markdown library settings:
  // config.amendLibrary('md', mdLib => {
  //   mdLib.use(markdownItAnchor, {
  //     permalink: markdownItAnchor.permalink.ariaHidden({
  //       placement: 'after',
  //       class: 'header-anchor',
  //       symbol: '#',
  //       ariaHidden: false,
  //     }),
  //     level: [1, 2, 3, 4],
  //     slugify: config.getFilter('slugify'),
  //   });
  // });

  // Shortcodes
  config.addShortcode('image', image);

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: 'njk',

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: 'njk',

    dir: {
      input: 'src', // default: "."
      includes: '_includes', // relative to input dir
      data: '_data', // relative to input dir
      layouts: '_includes/layouts', // relative to input dir
      output: '_site', // relative to root
    },
  };
};
