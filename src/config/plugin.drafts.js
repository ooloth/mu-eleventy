// When using `addGlobalData` and you *want* to return a function, you must nest functions like this.
// `addGlobalData` acts like a global data file and runs the top level function it receives.
const getPermalink = () => data => !data.published && !process.env.BUILD_DRAFTS ? false : data.permalink;

// When using `addGlobalData` and you *want* to return a function, you must nest functions like this.
// `addGlobalData` acts like a global data file and runs the top level function it receives.
const getExcludeFromCollections = () => data =>
  !data.published && !process.env.BUILD_DRAFTS ? true : data.eleventyExcludeFromCollections;

module.exports = config => {
  config.addGlobalData('eleventyComputed.permalink', getPermalink);
  config.addGlobalData('eleventyComputed.eleventyExcludeFromCollections', getExcludeFromCollections);

  let loggedDrafts = false;

  config.on('eleventy.before', ({ runMode }) => {
    const isLocalBuild = runMode === 'serve' || runMode === 'watch';

    process.env.BUILD_DRAFTS = isLocalBuild ? true : false;

    // Only log once
    if (!loggedDrafts) {
      console.log(`[ooloth/michaeluloth.com] ${isLocalBuild ? 'Including' : 'Excluding'} drafts...`);
      loggedDrafts = true;
    }
  });
};
