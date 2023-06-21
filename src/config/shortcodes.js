/**
 *
 * @param {string*} url
 * @param {number} width
 * @returns {string}
 */
function transformCloudinaryImage(url, width) {
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
function image(url, alt, caption) {
  const transformedUrl = transformCloudinaryImage(url, 800);
  const altText = alt ?? '';

  if (caption) {
    return `<figure><img src="${transformedUrl}" alt="${altText}" /><figcaption>${caption}</figcaption></figure>`;
  }

  return `<img src="${transformedUrl}" alt="${altText}" />`;
}

module.exports = { image };
