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

  /**
   * find the closure of attributes
   *
   * @param {Set<string> | Array<string>} attributes - Attribute set of which we want to find a closure
   * @returns {Set<string>} closure
   */
  find_closure_of_attributes(attributes, fds = this.fds) {
    let closure = new Set(attributes)

    while (true) {
      const previous = closure
      for (const fd of fds) {
        if (set_operation.is_superset(previous, fd.lhs)) {
          closure = set_operation.union(closure, fd.rhs)
        }
      }

      if (set_operation.is_superset(previous, closure)) {
        break
      }
    }

    return closure
  }

  /**
   * check a given fds are equivalent to the original
   *
   * @param {Set<Fd | FdByArray> | Array<Fd | FdByArray>} fds - a given fds
   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
   * @returns {boolean}
   */
  check_fds_are_equivalent(fds, fds_to_compare = this.fds) {
    let given_fds = new Set()
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
      given_fds.add({ lhs: new Set(fd.lhs), rhs: new Set(fd.rhs) })
    }

    // check this.fds+ >= given_fds+
    for (const fd of given_fds) {
      const closure = this.find_closure_of_attributes(fd.lhs, fds_to_compare)
      if (!set_operation.is_superset(closure, fd.rhs)) {
        return false
      }
    }

    // check this.fds+ <= given_fds+
    for (const fd of fds_to_compare) {
      const closure = this.find_closure_of_attributes(fd.lhs, given_fds)
      if (!set_operation.is_superset(closure, fd.rhs)) {
        return false
      }
    }

    return true
  }

  /**
   * check whether the scheme has a minimal cover
   *
   * @param {Set<Fd>} fds - functional dependencies
   * @returns {boolean}
   */
  is_minimal(fds = this.fds) {
    if (!(set_operation.every(fds, fd => fd.rhs.size === 1))) {
      return false
    }

    for (const fd of fds) {
      const new_fds = new Set(fds)
      new_fds.delete(fd)
      for (const attr of fd.lhs) {
        const new_lhs = new Set(fd.lhs)
        new_lhs.delete(attr)
        const new_fd = { lhs: new_lhs, rhs: fd.rhs }
        new_fds.add(new_fd)
        if (this.check_fds_are_equivalent(fds, new_fds)) {
          return false
        }
        new_fds.delete(new_fd)
      }
    }

    for (const fd of fds) {
      const new_fds = new Set(fds)
      new_fds.delete(fd)
      if (this.check_fds_are_equivalent(fds, new_fds)) {
        return false
      }
    }

    return true
  }

  /**
   * find a minimal cover
   *
   * @param {Set<Fd>} fds - functional dependencies
   * @returns Set<Fd>
   */
  find_minimal_cover(fds = this.fds) {
    // step 1
    let result_fds = new Set(fds)

    // step 2
    for (const fd of result_fds) {
      if (fd.rhs.size !== 1) {
        result_fds.delete(fd)
        for (const attr of fd.rhs) {
          result_fds.add({ lhs: new Set(fd.lhs), rhs: new Set([attr]) })
        }
      }
    }

    // step 3
    for (const fd of result_fds) {
      const new_fds = new Set(result_fds)

      new_fds.delete(fd)

      for (const attr of fd.lhs) {
        const new_lhs = new Set(fd.lhs)
        new_lhs.delete(attr)
        const new_fd = { lhs: new_lhs, rhs: fd.rhs }
        new_fds.add(new_fd)
        if (this.check_fds_are_equivalent(result_fds, new_fds)) {
          result_fds = new_fds
        }
      }
    }

    // step 4
    for (const fd of result_fds) {
      const new_fds = new Set(result_fds)

      new_fds.delete(fd)

      if (this.check_fds_are_equivalent(result_fds, new_fds)) {
        result_fds = new_fds
      }
    }

    return result_fds
  }

  /**
   * find all the keys
   *
   * @param {Set<Fd>} fds - functional dependencies
   * @returns Set<Set<string>>
   */
  find_all_keys(fds = this.fds) {
    const number_of_attributes = this.attributes.size
    const binary_expressions = []

    for (let i = 0; i < 2 ** number_of_attributes; i++) {
      const expression = []
      let number = i
      for (let j = 0; j < number_of_attributes; j++) {
        expression.push(number % 2)
        number = number >> 1
      }
      binary_expressions.push(expression)
    }

    binary_expressions.sort((a, b) => {
      const sum_of_elements_in_a = a.reduce((sum, element) => sum + element, 0)
      const sum_of_elements_in_b = b.reduce((sum, element) => sum + element, 0)
      return sum_of_elements_in_a - sum_of_elements_in_b
    })

    const keys = new Set()
    const U = [...this.attributes]

    for (const expression of binary_expressions) {
      const X = new Set()

      for (let i = 0; i < number_of_attributes; i++) {
        if (expression[i] === 1) {
          X.add(U[i])
        }
      }

      const Xplus = this.find_closure_of_attributes(X, fds)
      if (
        set_operation.is_superset(Xplus, this.attributes) &&
        set_operation.every(keys, key => !set_operation.is_superset(X, key))
      ) {
        keys.add(X)
      }
    }

    return keys
  }

  /**
   * check whether the scheme is in 3NF
   *
   * @param {Set<Fd>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_in_3NF(fds = this.fds) {
    const minimal_cover = this.find_minimal_cover(fds)
    const keys = this.find_all_keys(fds)
    const prime_attributes = new Set(
      [...keys].reduce((union, key) => set_operation.union(union, key),
      new Set())
    )

    for (const fd of minimal_cover) {
      const X = fd.lhs
      const A = [...fd.rhs][0] // fd.rhs is a singleton because the fd is in the minimal cover
      const Xplus = this.find_closure_of_attributes(X, fds)
      if (
        !set_operation.is_superset(Xplus, this.attributes) && // X is not a superkey
        !prime_attributes.has(A) // A is not a prime attribute
      ) {
        return false
      }
    }

    return true
  }
}

/**
 * check two fd relation schemes are the same
 *
 * @param {FdRelationScheme} R1 - fd relation scheme
 * @param {FdRelationScheme} R2 - fd relation scheme
 * @returns {boolean}
 */
function is_equivalent(R1, R2) {
  if (R1.name !== R2.name) {
    return false
  }

  if (!(
    set_operation.is_superset(R1.attributes, R2.attributes) &&
    set_operation.is_superset(R2.attributes, R1.attributes)
  )) {
    return false
  }

  if (!(R1.check_fds_are_equivalent(R2.fds))) {
    return false
  }

  return true
}

module.exports = {
  FdRelationScheme,
  is_equivalent
}
