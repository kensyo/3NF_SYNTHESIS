'use strict'

const util = require('./util')
const get_type = util.get_type
const set_operation = util.set_operation

/**
 * @typedef {Object} FdByArray functional dependency
 * @property {Array<string>} lhs left hand side
 * @property {Array<string>} rhs right hand side */

/**
 * @typedef {Object} Fd functional dependency
 * @property {Set<string>} lhs left hand side
 * @property {Set<string>} rhs right hand side */

/**
 * Relation scheme with fds only
 * @constructor
 */
class FdRelationScheme {
  /** @type {string} */
  name;
  /** @type {Set<string>} */
  attributes;
  /** @type {Set<Fd>} */
  fds;

  /**
   * @param {string} name relation name
   * @param {Set<string> | Array<string>} attributes
   * @param {Set<FdByArray | Fd> | Array<FdByArray | Fd>} fds functional dependencies
   * @throws {TypeError} - thrown if attributes and fds is not either set or array
   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
   */
  constructor(name, attributes, fds) {
    this.name = name

    const attributes_type = get_type(attributes)
    if (attributes_type === 'set') {
      this.attributes = attributes
    } else if (attributes_type === 'array') {
      this.attributes = new Set(attributes)
    } else {
      throw new TypeError('Must be Set or Array');
    }

    const fds_type = get_type(fds)
    if (!(fds_type === 'set' || fds_type === 'array')) {
      throw new TypeError('Must be Set or Array');
    }
    this.fds = new Set()

    // validate attribtues and fds
    for (const fd of fds) {
      for (const attribute of fd.lhs) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }
      for (const attribute of fd.rhs) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }
      this.fds.add({ lhs: new Set(fd.lhs), rhs: new Set(fd.rhs) })
    }

  }
}

module.exports = {
  FdRelationScheme,
}
