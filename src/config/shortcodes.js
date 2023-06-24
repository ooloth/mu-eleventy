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
  const w = width ?? 720;

  if (!cloudinaryUrl.includes('cloudinary')) {
    throw Error(`Not a cloudinary URL: ${cloudinaryUrl}`);
  }
  if (cloudinaryUrl.includes('upload/')) {
    return cloudinaryUrl.replace('upload/', `upload/c_scale,w_${w},f_auto,q_auto/`);
  }
  if (cloudinaryUrl.includes('fetch/')) {
    return cloudinaryUrl.replace('fetch/', `fetch/c_scale,w_${w},f_auto,q_auto/`);
  }
  if (cloudinaryUrl.includes('youtube/')) {
    return cloudinaryUrl.replace('youtube/', `youtube/c_scale,w_${w},f_auto,q_auto/`);
  }

  return cloudinaryUrl;
}

/**
 *
 */
async function image(params) {
  const {
    id,
    loading = 'lazy',
    widths = [
      '350', // image layout width on phone at 1x DPR
      '700', // image layout width on phone at 2x DPR
      '850',
      '1020',
      '1200', // image layout width on phone at 3x DPR
      '1440', // max image layout width at 2x DPR (skipped 1x since 700px is already included above)
      '1680',
      '1920',
      '2160', // max image layout width at 3x DPR
    ],
    // For blog posts and notes, image layout size currently maxes out when browser hits 768px
    // NOTE: browser takes first media query that's true, so be careful about the order
    sizes = '(min-width: 768px) 768px, 100vw',
  } = params;
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

  const src = insertOptimizationTransformations(imageDetails.secure_url, widths.at(-1));
  const alt = imageDetails?.context?.custom?.alt ?? ' '; // comes from "Description" field in contextual metadata
  const caption = imageDetails?.context?.custom?.caption; // comes from "Title" field in contextual metadata
  const srcset = widths
    .map(width => `${insertOptimizationTransformations(imageDetails.secure_url, width)} ${width}w`)
    .join(', ');

  const img = `<img src="${src}" srcset="${srcset}" sizes="${sizes}" alt="${alt}" width="${imageDetails.width}" height="${imageDetails.height}" loading="${loading}" decoding="${decoding}" class="image" />`;

  return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
}

module.exports = { image };
