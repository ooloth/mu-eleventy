const eleventyFetch = require('@11ty/eleventy-fetch');

/**
 *
 * @param {string} publicId The name of the image in Cloudinary, including all folder names (e.g. mu/cool-pic)
 * @returns {string}
 * @see https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
 */
function getDetailsUrl(publicId) {
  return `https://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`;
}

/**
 *
 * @param {string} cloudinaryUrl A full Cloudinary URL with no transformations (e.g. https://res.cloudinary.com/cloud_name/image/upload/version/public-id.jpg)
 * @param {number} width How wide (in pixels) this image will be displayed in the layout, ignoring DPR adjustments
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
  const { id, loading = 'lazy', widths = ['800'] } = params;
  const decoding = loading === 'eager' ? 'sync' : 'async';

  // TODO: handle no id param
  // TODO: handle id param missing folder prefix in public_id
  const detailsUrl = getDetailsUrl(id);

  // See: https://www.11ty.dev/docs/plugins/fetch/
  const imageDetails = await eleventyFetch(detailsUrl, {
    duration: '1y', // NOTE: if I'm not seeing updates locally, this is probably why
    type: 'json',
  }).catch(error => {
    throw Error(`Error fetching image details for "${id}" using the URL "${detailsUrl}":\n\n${error}\n`);
  });
  console.log('details', imageDetails);

  const src = insertOptimizationTransformations(imageDetails.secure_url, widths.at(-1));
  const alt = imageDetails?.context?.custom?.alt ?? ' '; // comes from "Description" field in contextual metadata
  const caption = imageDetails?.context?.custom?.caption; // comes from "Title" field in contextual metadata
  const srcset = ''; // TODO: generate from widths prop using insertOptimizationTransformations(imageDetails.secure_url);
  const sizes = ''; // TODO: generate from widths prop using insertOptimizationTransformations(imageDetails.secure_url);0

  // const source_low = `https://res.cloudinary.com/***********/image/upload/c_scale,w_400/f_auto/blog/${params.filename}`;
  // const source_med = `https://res.cloudinary.com/***********/image/upload/c_scale,w_800/f_auto/blog/${params.filename}`;
  // const source_high = `https://res.cloudinary.com/***********/image/upload/c_scale,w_1600/f_auto/blog/${params.filename}`;

  const img = `<img src="${src}" alt="${alt}" width="${imageDetails.width}" height="${imageDetails.height}" loading="${loading}" decoding="${decoding}" class="image" />`;

  return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
}

module.exports = { image };
