const eleventyFetch = require('@11ty/eleventy-fetch');

/**
 *
 * @param {string} url
 * @param {number} width
 * @returns {string}
 */
function getCloudinaryUrl(url, width) {
  const w = width ?? 'auto';

  if (url.includes('cloudinary')) {
    if (url.includes('upload/')) {
      return url.replace('upload/', `upload/w_${w},f_auto,q_auto,dpr_2.0/`);
    }
    if (url.includes('fetch/')) {
      return url.replace('fetch/', `fetch/w_${w},f_auto,q_auto,dpr_2.0/`);
    }
    if (url.includes('youtube/')) {
      return url.replace('youtube/', `youtube/w_${w},f_auto,q_auto,dpr_2.0/`);
    }
  }

  return url;
}

// TODO: build URL using cloudinary url builder using image public_id only: https://cloudinary.com/documentation/javascript_image_transformations#image_optimizations, cloudinary.com/documentation/javascript_integration
// TODO: get image metadata from cloudinary (e.g. width, height)
// TODO: add srcset and sizes attributes and test to confirm they make a difference
/**
 *
 */
async function image(args) {
  const { url, loading = 'lazy', widths = ['800px'] } = args;
  const decoding = loading === 'eager' ? 'sync' : 'async';

  const src = getCloudinaryUrl(url, 800);
  const alt = ''; // TODO: get from "Description" metadata
  const caption = ''; // TODO: get from "Title" metadata
  const srcset = ''; // TODO: generate from widths prop
  const sizes = ''; // TODO: generate from widths prop

  const source_low = `https://res.cloudinary.com/***********/image/upload/c_scale,w_400/f_auto/blog/${params.filename}`;
  const source_med = `https://res.cloudinary.com/***********/image/upload/c_scale,w_800/f_auto/blog/${params.filename}`;
  const source_high = `https://res.cloudinary.com/***********/image/upload/c_scale,w_1600/f_auto/blog/${params.filename}`;
  const infoURL = `https://res.cloudinary.com/***********/image/upload/fl_getinfo/blog/${params.filename}`;
  const result = await eleventyFetch(infoURL, {
    duration: '1y',
    type: 'json',
  }).catch(error => {
    console.log(`oh no...${error}`);
  });

  const img = `<img src=${src} alt=${alt} loading=${loading} decoding=${decoding} class="image" />`;

  return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
}

module.exports = { image };
