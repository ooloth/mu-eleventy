/**
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removeDrafts = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => item.data.published) : collection;

/**
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removeScheduled = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => item.date <= Date.now()) : collection;

/**
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removePrivate = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => !item.data.private) : collection;

const sortByParent = collection => {
  const tree = {};
  const roots = [];

  // Initialize every item and index by its title
  collection.forEach(item => {
    item.children = []; // Add an empty array for the children if it does not already exist
    tree[item.fileSlug] = item; // Index each item by its file slug
  });

  // Connect children with their parents and separate the roots
  collection.forEach(item => {
    // If there is a parent, push the current item into its parent's children array
    if (item.data.parent) {
      if (!tree[item.data.parent]) {
        // TODO: throw an error to avoid hiding the page link indefinitely?
        console.log(`tree does not contain ${item.data.parent}`);
      }

      tree[item.data.parent].children.push(item);
    }
    // If there is no parent, the item is a root and is pushed into the roots array
    else roots.push(item);
  });

  return roots;
};

module.exports = { removeDrafts, removePrivate, removeScheduled, sortByParent };
