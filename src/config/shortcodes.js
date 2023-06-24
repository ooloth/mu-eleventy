const eleventyFetch = require('@11ty/eleventy-fetch');

// TODO: https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id

/**
 *
 * @param {string} imageName
 * @returns {string}
 * @see https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
 *  NOTE: can only be called 500 times in an hour (so don't use for Likes page)
 */
function fetchImageDetailsByPublicId(publicId) {
  // https://<API_KEY>:<API_SECRET>@api.cloudinary.com/v1_1/<cloud_name>/resources/image/upload/sample
  return `https://res.cloudinary.com/ooloth/image/upload/mu/${imageName}.jpg`;
}

/**
 *
 * @param {string} publicId
 * @returns {string}
 */
function getCloudinaryUrl(publicId) {
  return `https://res.cloudinary.com/ooloth/image/upload/${publicId}.jpg`;
}

/**
 *
 * @param {string} publicId
 * @returns {string}
 */
function getDetailsUrl(publicId) {
  return `https://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`;
}

/**
 *
 * @param {string} cloudinaryUrl
 * @returns {string}
 */
function insertInfoTransformation(cloudinaryUrl) {
  if (!cloudinaryUrl.includes('cloudinary')) {
    throw Error(`Not a cloudinary URL: ${cloudinaryUrl}`);
  }

  if (cloudinaryUrl.includes('upload/')) {
    return cloudinaryUrl.replace('upload/', `upload/fl_getinfo/`);
  }

  return cloudinaryUrl;
}

/**
 *
 * @param {string} cloudinaryUrl
 * @param {number} width
 * @returns {string}
 * @see https://cloudinary.com/documentation/transformation_reference
 */
function insertOptimizationTransformations(cloudinaryUrl, width) {
  const w = width ?? 'auto';

  if (!cloudinaryUrl.includes('cloudinary')) {
    throw Error(`Not a cloudinary URL: ${cloudinaryUrl}`);
  }
  if (cloudinaryUrl.includes('upload/')) {
    return cloudinaryUrl.replace('upload/', `upload/w_${w},f_auto,q_auto,dpr_2.0/`);
  }
  if (cloudinaryUrl.includes('fetch/')) {
    return cloudinaryUrl.replace('fetch/', `fetch/w_${w},f_auto,q_auto,dpr_2.0/`);
  }
  if (cloudinaryUrl.includes('youtube/')) {
    return cloudinaryUrl.replace('youtube/', `youtube/w_${w},f_auto,q_auto,dpr_2.0/`);
  }

  return cloudinaryUrl;
}

// TODO: build URL using cloudinary url builder using image public_id only: https://cloudinary.com/documentation/javascript_image_transformations#image_optimizations, cloudinary.com/documentation/javascript_integration
// TODO: get image metadata from cloudinary (e.g. width, height)
// TODO: add srcset and sizes attributes and test to confirm they make a difference
/**
 *
 */
async function image(params) {
  const { id, loading = 'lazy', widths = ['800px'] } = params;
  const decoding = loading === 'eager' ? 'sync' : 'async';

  // const url = getCloudinaryUrl(id);

  // Get image width and height from Cloudinary
  // const infoUrl = insertInfoTransformation(url);

  // const info = await eleventyFetch(infoUrl, {
  //   duration: '1y',
  //   type: 'json',
  // }).catch(error => {
  //   throw Error(`Error fetching info for "${url}" using the URL "${infoUrl}":\n\n${error}\n`);
  // });

  const detailsUrl = getDetailsUrl(id);

  const imageDetails = await eleventyFetch(detailsUrl, {
    duration: '1y',
    type: 'json',
  }).catch(error => {
    throw Error(`Error fetching image details for "${id}" using the URL "${detailsUrl}":\n\n${error}\n`);
  });
  console.log('details', imageDetails);

  // const details = fetchImageDetailsByPublicId(name);

  const src = insertOptimizationTransformations(url, 800);
  const alt = ' '; // TODO: get from "Description" metadata
  const caption = ''; // TODO: get from "Title" metadata
  const srcset = ''; // TODO: generate from widths prop
  const sizes = ''; // TODO: generate from widths prop

  // const source_low = `https://res.cloudinary.com/***********/image/upload/c_scale,w_400/f_auto/blog/${params.filename}`;
  // const source_med = `https://res.cloudinary.com/***********/image/upload/c_scale,w_800/f_auto/blog/${params.filename}`;
  // const source_high = `https://res.cloudinary.com/***********/image/upload/c_scale,w_1600/f_auto/blog/${params.filename}`;

  const img = `<img src="${src}" alt="${alt}" width="${info.output.width}" height="${info.output.height}" loading="${loading}" decoding="${decoding}" class="image" />`;

  return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
}

module.exports = { image };
