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

// Unified plugins (remark, rehype, retext)
const unified = require('eleventy-plugin-unified');

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
  config.addPlugin(unified, {
    htmlTransforms: ['rehype-minify-whitespace'],
    // FIXME: enabling this removes all {% image %} shortcodes from the output
    // markdownTransforms: ['@fec/remark-a11y-emoji'],
  });

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
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('notes', collectionApi => {
    const notes = collectionApi
      .getFilteredByGlob('src/content/writing/**/*.md')
      .filter(item => item.data.destination !== 'blog')
      .sort((a, b) => a.inputPath.localeCompare(b.inputPath));

    // Remove private notes BEFORE sorting by parents to remove private children and grandchildren
    // Remove private notes AFTER sorting by parents to automatically remove all non-private children of private parents as well
    return removePrivate(sortByParent(removePrivate(notes)));
  });

  // Pages
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('pages', collectionApi => collectionApi.getFilteredByGlob('src/content/pages/**/*.md'));

  // All collection items for auditing purposes
  // See: https://www.11ty.dev/docs/collections/#getfilteredbyglob(-glob-)
  config.addCollection('auditContent', async collectionApi => {
    // Only proceed if this is an audit build
    if (!process.env.AUDIT_CONTENT) return [];

    const allContentPages = collectionApi.getFilteredByGlob(['./**/*.md', './**/*.webc']);
    const noTitle = [];
    const scheduled = [];
    const draftsByStatus = {
      announcing: { emoji: '🎙️', items: [] },
      publishing: { emoji: '🚀', items: [] },
      editing: { emoji: '💅', items: [] },
      drafting: { emoji: '🤮', items: [] },
      outlining: { emoji: '🌳', items: [] },
      researching: { emoji: '🔍', items: [] },
      unknown: { emoji: '🤷‍♂️', items: [] },
    };

    const isPost = item => item.data.destination === 'blog';

    allContentPages.forEach(item => {
      if (!item.data.title) noTitle.push(item);
      if (!isPost(item)) return;

      // If item is both scheduled and publishing, put it in the scheduled list
      if (item.date > Date.now()) {
        scheduled.push(item);
        return;
      }

      // Sort drafts by status
      Object.keys(draftsByStatus).forEach(key => {
        if (item.data.status === key) {
          draftsByStatus[key].items.push(item);
          return;
        }
      });

      // If item is not published, put it in the unknown status list
      if (!item.data.status && !item.data.published) draftsByStatus.unknown.items.push(item);
    });

    const getItemsHtml = items => items.map(item => `<li>${item.fileSlug}</li>`).join('');

    const noTitleHtml = noTitle.length ? `<h3>🤷‍♂️ Missing a title️</h3><ul>${getItemsHtml(noTitle)}</ul>` : '';

    const getScheduledItemsHtml = items =>
      items
        // Sort by date, ascending using localeCompare
        .sort((a, b) => a.date.localeCompare(b.date))
        // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
        .map(
          item =>
            `<li><strong>${DateTime.fromJSDate(item.date, { zone: 'America/Toronto' }).toFormat('MMM dd')}:</strong> ${
              item.data.title
            }</li>`,
        )
        .join('');

    const scheduledHtml =
      '<h3>Scheduled 📆</h3>' +
      (scheduled.length ? `<ul>${getScheduledItemsHtml(scheduled)}</ul>` : '<em>Time to schedule a post!</em>');

    const draftsHtml = Object.keys(draftsByStatus)
      .map(key =>
        draftsByStatus[key].items.length
          ? `<h3>${key[0].toLocaleUpperCase() + key.slice(1)} ${draftsByStatus[key].emoji}</h3><ul>${getItemsHtml(
              draftsByStatus[key].items,
            )}</ul>`
          : '',
      )
      .join('');

    const sendEmail = require('./lib/sendGrid/sendEmail.js');
    await sendEmail('Blog post status ✍️', noTitleHtml + scheduledHtml + draftsHtml);

    // Return empty array to prevent an Eleventy build error
    return [];
  });

  // Data extensions
  config.addDataExtension('yaml', contents => yaml.load(contents));

  // Filters
  config.addFilter('readableDate', (date, format) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: 'America/Toronto' }).toFormat(format || 'DD');
  });

  config.addFilter('htmlDateString', date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'America/Toronto' }).toFormat('yyyy-LL-dd');
  });

  // Return true if item is in collection (at any ancestry level)
  config.addFilter('isPageInCollection', (page, collection) =>
    collection.some(item => item.url === page.url || (item.children || []).some(child => child.url === page.url)),
  );

  // Return all the tags used in a collection
  config.addFilter('getAllTags', collection => {
    let tagSet = new Set();
    for (let item of collection) {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet);
  });

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
