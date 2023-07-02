/**
 * Given a list of collection items, removes any that don't set "published" to true.
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removeDrafts = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => item.data.published) : collection;

/**
 * Given a list of collection items, removes any that are scheduled for a future date.
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removeScheduled = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => item.date <= Date.now()) : collection;

/**
 * Given a list of collection items, removes any that are marked as private.
 * @function
 * @template T
 * @param {array<T>} collection
 * @returns {array<T>}
 */
const removePrivate = collection =>
  process.env.ELEVENTY_PRODUCTION ? collection.filter(item => !item.data.private) : collection;

/**
 * Given an array of collection items, returns the array with child items nested under their parents.
 * @function
 * @template T
 * @param {array} collection
 * @returns {array}
 */
const sortByParent = collection => {
  const tree = {};
  const roots = [];

  // TODO: rewrite as a single map or reduce?

  // Prep by adding a "children" property to each item and indexing all file names
  collection.forEach(item => {
    item.children = []; // Add an empty array for the children if it does not already exist
    tree[item.fileSlug.toLowerCase()] = item; // Index each item by its lowercase file slug
  });

  // Connect children with their parents and separate the roots
  collection.forEach(item => {
    if (!item.data.parent) {
      roots.push(item); // If the item has no parent, it's a root (a.k.a. parent)
      return;
    }

    // Get the lowercase version of the parent name
    const parent = item.data.parent.toLowerCase();

    // Handle not finding the parent name in the tree
    if (!tree[parent]) {
      // TODO: throw an error to avoid hiding the page link indefinitely?
      console.log(`tree does not contain ${item.data.parent}`);
    }

    // Add the current item to the parent's children array
    tree[parent].children.push(item);
  });

  return roots;
};

module.exports = { removeDrafts, removePrivate, removeScheduled, sortByParent };
