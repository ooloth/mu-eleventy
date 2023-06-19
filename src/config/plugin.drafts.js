// When using `addGlobalData` and you *want* to return a function, you must nest functions like this.
// `addGlobalData` acts like a global data file and runs the top level function it receives.
const getPermalink = () => data =>
  // Always skip during non-watch/serve builds
  !data.date && !process.env.BUILD_DRAFTS ? false : data.permalink;

// When using `addGlobalData` and you *want* to return a function, you must nest functions like this.
// `addGlobalData` acts like a global data file and runs the top level function it receives.
const getExcludeFromCollections = () => data =>
  // Always exclude from non-watch/serve builds
  !data.date && !process.env.BUILD_DRAFTS ? true : data.eleventyExcludeFromCollections;

// module.exports = { getPermalink, getExcludeFromCollections };
module.exports = config => {
  config.addGlobalData('eleventyComputed.permalink', getPermalink);
  config.addGlobalData('eleventyComputed.eleventyExcludeFromCollections', getExcludeFromCollections);

  let logged = false;

  config.on('eleventy.before', ({ runMode }) => {
    // Set BUILD_DRAFTS to false during builds and true during watch/serve
    process.env.BUILD_DRAFTS = runMode === 'build' ? false : true;

    // Only log once
    if (!logged) {
      console.log(`[ooloth/michaeluloth.com] ${runMode === 'build' ? 'Excluding' : 'Including'} drafts.`);
      logged = true;
    }
  });
};
