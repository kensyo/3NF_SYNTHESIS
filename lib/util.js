'use strict'

/**
 * get a type
 *
 * @param {any} a - target
 * @returns {string} lowercased type name
 */
function get_type(a) {
  const type = Object.prototype.toString.call(a).slice(8, -1).toLowerCase()
  return type
}

