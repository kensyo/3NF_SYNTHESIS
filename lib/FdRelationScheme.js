'use strict'

const util = require('./util')
const set_operation = util.set_operation

/**
 * Receive pair and return fd
 *
 * @param {Array<Array<string>} array_fd - first element and second element mean lhs and rhs respectively. array_fd may be destructed.
 *
 * @returns {string}
 *
 * @example
 * array_fd [['A'], ['C', 'B']] means A->BC and returns string [["A"],["B","C"]]
 * array_fd [['school', 'classroom', 'classroom'] , ['teacher']] (classroom duplicated)  means `school` and `classroom` determine `teacher`
 *   returns string [["classroom","classroom","school"],["teacher"]]
 *
 */
function generate_fd(array_fd) {
  validate_array_fd(array_fd)

  const lhs = [...new Set(array_fd[0])]
  const rhs = [...new Set(array_fd[1])]

  lhs.sort()
  rhs.sort()

  return JSON.stringify([lhs, rhs])
}

/**
 * validate a fd expressed by array
 *
 * @param {Array<Array<string>>} array_fd - a fd expressed by array
 * @throws {TypeError}
 * @throws {RangeError}
 */
function validate_array_fd(array_fd) {
  if (util.get_type(array_fd) !== 'array') {
    throw new TypeError('array_fd must be array. array_fd: ' + JSON.stringify(array_fd))
  }

  if (array_fd.length !== 2) {
    throw new RangeError('array_fd length must be 2. array_fd: ' + JSON.stringify(array_fd))
  }

  if (util.get_type(array_fd[0]) !== 'array') {
    throw new TypeError('array_fd[0] must be array. array_fd: ' + JSON.stringify(array_fd))
  }

  if (util.get_type(array_fd[1]) !== 'array') {
    throw new TypeError('array_fd[1] must be array. array_fd: ' + JSON.stringify(array_fd))
  }
}

/**
 * validate a fd expressed by string or array
 *
 * @param {string} fd - a fd expressed by string or array
 * @throws {SyntaxError}
 * @throws {TypeError}
 * @throws {RangeError}
 */
function validate_fd(fd) {
  const fd_type = util.get_type(fd)
  let array_fd = null

  if (fd_type === 'array') {
    array_fd = fd
  } else if (fd_type === 'string') {
    try {
      array_fd = get_as_object(fd)
    }
    catch (err) {
      // SyntaxError
      throw err
    }
  } else {
    throw new TypeError('invalid fd expression: ' + JSON.stringify(fd))
  }

  validate_array_fd(array_fd)
}

/**
 * get fd as object
 *
 * @param {string} fd - functional dependency
 */
function get_as_object(fd) {
  const obj = JSON.parse(fd)

  return obj
}

/**
 * get the lhs of a given fd
 *
 * @param {string} fd - functioal dependency
 * @returns {Array<string>} lhs
 */
function get_lhs(fd) {
  const obj = get_as_object(fd)

  return obj[0]
}

/**
 * get the rhs of a given fd
 *
 * @param {string} fd - functioal dependency
 * @returns {Array<string>} rhs
 */
function get_rhs(fd) {
  const obj = get_as_object(fd)

  return obj[1]
}

class FdRelationScheme {
  /** @type {string} */
  name;
  /** @type {Set<string>} */
  attributes;
  /** @type {Set<string>} */
  fds;

  /**
   * @param {string} name relation name
   * @param {Set<string> | Array<string>} attributes
   * @param {Set<string | Array<Array<string>>> | Array<string | Array<Array<string>>>} fds functional dependencies
   * @throws {TypeError} - thrown if attributes and fds is not either set or array
   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
   */
  constructor(name, attributes, fds) {
    this.name = name

    const attributes_type = util.get_type(attributes)
    if (attributes_type === 'set') {
      this.attributes = attributes
    } else if (attributes_type === 'array') {
      this.attributes = new Set(attributes)
    } else {
      throw new TypeError('Attributes must be Set or Array. attributes: ' + JSON.stringify(attributes));
    }

    const fds_type = util.get_type(fds)
    if (!(fds_type === 'set' || fds_type === 'array')) {
      throw new TypeError('fds must be Set or Array. fds: ' + JSON.stringify(fds));
    }
    this.fds = new Set()

    // validate attribtues and fds
    for (const elem of fds) {
      const elem_type = util.get_type(elem)
      let fd = ''
      if (elem_type === 'array') {
        fd = generate_fd(elem)
      } else if (elem_type === 'string') {
        validate_fd(elem)
        fd = elem
      } else {
        throw new TypeError('elem must be array or string. elem: ' + elem);
      }
      for (const attribute of get_lhs(fd)) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }

      for (const attribute of get_rhs(fd)) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }

      this.fds.add(fd)
    }

  }

  /**
   * find the closure of attributes
   *
   * @param {Set<string> | Array<string>} attributes - Attribute set of which we want to find a closure
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {Set<string>} closure
   */
  find_closure_of_attributes(attributes, fds = this.fds) {
    let closure = new Set(attributes)

    while (true) {
      const previous = closure
      for (const fd of fds) {
        const lhs = new Set(get_lhs(fd))
        const rhs = new Set(get_rhs(fd))
        if (set_operation.is_superset(previous, lhs)) {
          closure = set_operation.union(closure, rhs)
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
   * @param {Array<Array<Array<string>> | string>} fds - a given fds
   * @param {Set<string>} [fds_to_compare] - functional dependencies to compare with
   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
   * @returns {boolean}
   */
  check_fds_are_equivalent(fds, fds_to_compare = this.fds) {
    let given_fds = new Set()

    for (const elem of fds) {
      const elem_type = util.get_type(elem)
      let fd = ''
      if (elem_type === 'array') {
        fd = generate_fd(elem)
      } else if (elem_type === 'string') {
        validate_fd(elem)
        fd = elem
      } else {
        throw new TypeError('elem must be array or string. elem: ' + elem);
      }
      for (const attribute of get_lhs(fd)) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }

      for (const attribute of get_rhs(fd)) {
        if (!this.attributes.has(attribute)) {
          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
        }
      }

      given_fds.add(fd)
    }

    // check this.fds+ >= given_fds+
    for (const fd of given_fds) {
      const closure = this.find_closure_of_attributes(get_lhs(fd), fds_to_compare)
      if (!set_operation.is_superset(closure, new Set(get_rhs(fd)))) {
        return false
      }
    }

    // check this.fds+ <= given_fds+
    for (const fd of fds_to_compare) {
      const closure = this.find_closure_of_attributes(get_lhs(fd), given_fds)
      if (!set_operation.is_superset(closure, new Set(get_rhs(fd)))) {
        return false
      }
    }

    return true
  }

  /**
   * check whether fds of a given scheme are a minimal cover
   *
   * @param {Set<string>} fds - functional dependencies
   * @returns {boolean}
   */
  is_minimal(fds = this.fds) {
    if (!(set_operation.every(fds, fd => get_rhs(fd).length === 1))) {
      return false
    }

    for (const fd of fds) {
      const new_fds = new Set(fds)
      new_fds.delete(fd)
      for (const attr of get_lhs(fd)) {
        const array_fd = get_as_object(fd)
        const array_fd_lhs = array_fd[0]
        const new_array_fd_lhs = array_fd_lhs.filter(item => item !== attr)
        array_fd[0] = new_array_fd_lhs
        const new_fd = generate_fd(array_fd)
        new_fds.add(new_fd)
        if (this.check_fds_are_equivalent(new_fds, fds)) {
          return false
        }
        new_fds.delete(new_fd)
      }
    }

    for (const fd of fds) {
      const new_fds = new Set(fds)
      new_fds.delete(fd)
      if (this.check_fds_are_equivalent(new_fds, fds)) {
        return false
      }
    }

    return true
  }

  /**
   * find a minimal cover
   *
   * @param {Set<string>} fds - functional dependencies
   * @returns {Set<string>}
   */
  find_minimal_cover(fds = this.fds) {
    // step 1
    let result_fds = new Set(fds)

    // step 2
    for (const fd of result_fds) {
      const array_fd = get_as_object(fd)
      if (array_fd[1].length !== 1) {
        result_fds.delete(fd)
        for (const attr of array_fd[1]) {
          const new_fd = generate_fd([array_fd[0], [attr]])
          result_fds.add(new_fd)
        }
      }
    }

    // step 3
    for (const fd of new Set(result_fds)) {
      const array_fd = get_as_object(fd)
      const base = new Set(result_fds)
      base.delete(fd)
      for (const attr of Array.from(array_fd[0])) {
        const base2 = new Set(base)
        const original_lhs = array_fd[0]
        const new_lhs = array_fd[0].filter(item => item !== attr)
        array_fd[0] = new_lhs
        const fd_to_add = generate_fd(array_fd)
        base2.add(fd_to_add)
        if (this.check_fds_are_equivalent(base2, result_fds)) {
          result_fds = new Set(base2)
        } else {
          array_fd[0] = original_lhs
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
   * @param {Set<string>} fds - functional dependencies
   * @returns Set<Set<string>>
   */
  find_all_keys(fds = this.fds) {
    const number_of_attributes = this.attributes.size
    const binary_expressions = []

    for (let i = 1; i < 2 ** number_of_attributes; i++) {
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
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_in_3NF(fds = this.fds) {
    const minimal_cover = this.find_minimal_cover(fds)
    const keys = this.find_all_keys(fds)
    const prime_attributes = new Set(
      [...keys].reduce(
        (union, key) => set_operation.union(union, key),
        new Set()
      )
    )

    for (const fd of minimal_cover) {
      const array_fd = get_as_object(fd)
      const X = array_fd[0]
      const A = array_fd[1][0] // fd.rhs is a singleton because the fd is in the minimal cover
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

  /**
   * check whether the scheme is in BCNF
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_in_BCNF(fds = this.fds) {
    const minimal_cover = this.find_minimal_cover(fds)

    for (const fd of minimal_cover) {
      const array_fd = get_as_object(fd)
      const X = array_fd[0]
      const Xplus = this.find_closure_of_attributes(X, fds)
      if (
        !set_operation.is_superset(Xplus, this.attributes) // X is not a superkey
      ) {
        return false
      }
    }

    return true
  }

  /**
   * find a projection of a fd set for a subset
   *
   * @param {Set<string>} subset - attributes
   * @param {Set<string>} [fds] - functional dependencies
   * @throws {RangeError} - thrown if subset is not included in this.attributes
   * @returns {Set<Fd>}
   */
  get_projection(subset, fds = this.fds) {
    if (!(set_operation.is_superset(this.attributes, subset))) {
      throw new RangeError('[' + [...subset] + '] is not included in [' + this.attributes + '].')
    }

    const number_of_attributes = subset.size
    const binary_expressions = []

    for (let i = 1; i < 2 ** number_of_attributes; i++) {
      const expression = []
      let number = i
      for (let j = 0; j < number_of_attributes; j++) {
        expression.push(number % 2)
        number = number >> 1
      }
      binary_expressions.push(expression)
    }

    let result = new Set()
    const Z = [...subset]

    for (const expression of binary_expressions) {
      const X = new Array()

      for (let i = 0; i < number_of_attributes; i++) {
        if (expression[i] === 1) {
          X.push(Z[i])
        }
      }

      const Xplus = this.find_closure_of_attributes(X, fds)
      const rhs = set_operation.intersection(Xplus, subset)
      const array_rhs = [...rhs]
      const added_fd = generate_fd([X, array_rhs])
      result.add(added_fd)
    }

    // NOTE: 
    // Strictly speaking, the minimal cover when the entire attribute set is restricted to
    // `subset` should be returned, but this is not a problem because the same result is
    // returned without the restriction. (See the code find_minimal_cover().)
    result = this.find_minimal_cover(result)
    return result
  }

}

module.exports = {
  generate_fd,
  FdRelationScheme
}

//const util = require('./util')
//const get_type = util.get_type
//const set_operation = util.set_operation

///**
// * @typedef {Object} FdByArray functional dependency
// * @property {Array<string>} lhs left hand side
// * @property {Array<string>} rhs right hand side */

///**
// * @typedef {Object} Fd functional dependency
// * @property {Set<string>} lhs left hand side
// * @property {Set<string>} rhs right hand side */

///**
// * Relation scheme with fds only
// * @constructor
// */
//class FdRelationScheme {
//  /** @type {string} */
//  name;
//  /** @type {Set<string>} */
//  attributes;
//  /** @type {Set<Fd>} */
//  fds;

//  /**
//   * @param {string} name relation name
//   * @param {Set<string> | Array<string>} attributes
//   * @param {Set<FdByArray | Fd> | Array<FdByArray | Fd>} fds functional dependencies
//   * @throws {TypeError} - thrown if attributes and fds is not either set or array
//   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
//   */
//  constructor(name, attributes, fds) {
//    this.name = name

//    const attributes_type = get_type(attributes)
//    if (attributes_type === 'set') {
//      this.attributes = attributes
//    } else if (attributes_type === 'array') {
//      this.attributes = new Set(attributes)
//    } else {
//      throw new TypeError('Must be Set or Array');
//    }

//    const fds_type = get_type(fds)
//    if (!(fds_type === 'set' || fds_type === 'array')) {
//      throw new TypeError('Must be Set or Array');
//    }
//    this.fds = new Set()

//    // validate attribtues and fds
//    for (const fd of fds) {
//      for (const attribute of fd.lhs) {
//        if (!this.attributes.has(attribute)) {
//          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
//        }
//      }
//      for (const attribute of fd.rhs) {
//        if (!this.attributes.has(attribute)) {
//          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
//        }
//      }
//      this.fds.add({ lhs: new Set(fd.lhs), rhs: new Set(fd.rhs) })
//    }

//  }

//  /**
//   * find the closure of attributes
//   *
//   * @param {Set<string> | Array<string>} attributes - Attribute set of which we want to find a closure
//   * @returns {Set<string>} closure
//   */
//  find_closure_of_attributes(attributes, fds = this.fds) {
//    let closure = new Set(attributes)

//    while (true) {
//      const previous = closure
//      for (const fd of fds) {
//        if (set_operation.is_superset(previous, fd.lhs)) {
//          closure = set_operation.union(closure, fd.rhs)
//        }
//      }

//      if (set_operation.is_superset(previous, closure)) {
//        break
//      }
//    }

//    return closure
//  }

//  /**
//   * check a given fds are equivalent to the original
//   *
//   * @param {Set<Fd | FdByArray> | Array<Fd | FdByArray>} fds - a given fds
//   * @throws {RangeError} - thrown if one or more of the attributes in a Fd aren't in the set of all the attribtues
//   * @returns {boolean}
//   */
//  check_fds_are_equivalent(fds, fds_to_compare = this.fds) {
//    let given_fds = new Set()
//    for (const fd of fds) {
//      for (const attribute of fd.lhs) {
//        if (!this.attributes.has(attribute)) {
//          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
//        }
//      }
//      for (const attribute of fd.rhs) {
//        if (!this.attributes.has(attribute)) {
//          throw new RangeError(attribute + ' is not in ' + this.attributes + '.')
//        }
//      }
//      given_fds.add({ lhs: new Set(fd.lhs), rhs: new Set(fd.rhs) })
//    }

//    // check this.fds+ >= given_fds+
//    for (const fd of given_fds) {
//      const closure = this.find_closure_of_attributes(fd.lhs, fds_to_compare)
//      if (!set_operation.is_superset(closure, fd.rhs)) {
//        return false
//      }
//    }

//    // check this.fds+ <= given_fds+
//    for (const fd of fds_to_compare) {
//      const closure = this.find_closure_of_attributes(fd.lhs, given_fds)
//      if (!set_operation.is_superset(closure, fd.rhs)) {
//        return false
//      }
//    }

//    return true
//  }

//  /**
//   * check whether the scheme has a minimal cover
//   *
//   * @param {Set<Fd>} fds - functional dependencies
//   * @returns {boolean}
//   */
//  is_minimal(fds = this.fds) {
//    if (!(set_operation.every(fds, fd => fd.rhs.size === 1))) {
//      return false
//    }

//    for (const fd of fds) {
//      const new_fds = new Set(fds)
//      new_fds.delete(fd)
//      for (const attr of fd.lhs) {
//        const new_lhs = new Set(fd.lhs)
//        new_lhs.delete(attr)
//        const new_fd = { lhs: new_lhs, rhs: fd.rhs }
//        new_fds.add(new_fd)
//        if (this.check_fds_are_equivalent(fds, new_fds)) {
//          return false
//        }
//        new_fds.delete(new_fd)
//      }
//    }

//    for (const fd of fds) {
//      const new_fds = new Set(fds)
//      new_fds.delete(fd)
//      if (this.check_fds_are_equivalent(fds, new_fds)) {
//        return false
//      }
//    }

//    return true
//  }

//  /**
//   * find a minimal cover
//   *
//   * @param {Set<Fd>} fds - functional dependencies
//   * @returns Set<Fd>
//   */
//  find_minimal_cover(fds = this.fds) {
//    // step 1
//    let result_fds = new Set(fds)

//    // step 2
//    for (const fd of result_fds) {
//      if (fd.rhs.size !== 1) {
//        result_fds.delete(fd)
//        for (const attr of fd.rhs) {
//          result_fds.add({ lhs: new Set(fd.lhs), rhs: new Set([attr]) })
//        }
//      }
//    }
//    if (this.name === 'test4minimal') {
//      console.log('hogho1')
//      console.log(result_fds)
//    }

//    // step 3
//    for (const fd of result_fds) {
//      const new_fds = new Set(result_fds)

//      new_fds.delete(fd)

//      for (const attr of fd.lhs) {
//        const new_lhs = new Set(fd.lhs)
//        new_lhs.delete(attr)
//        const new_fd = { lhs: new_lhs, rhs: fd.rhs }
//        new_fds.add(new_fd)
//        // console.log('new_fds', fd, new_fds)
//        if (this.check_fds_are_equivalent(result_fds, new_fds)) {
//          if (this.name === 'test4minimal') {
//            console.log('step 3')
//            console.log(fd)
//            console.log(result_fds)
//            console.log(new_fds)
//          }
//          result_fds = new_fds
//        }
//      }
//    }


//    // { lhs: Set(1) { 'B' }, rhs: Set(1) { 'B' } },
//    //   { lhs: Set(1) { 'B' }, rhs: Set(1) { 'C' } },
//    //   { lhs: Set(1) { 'B' }, rhs: Set(1) { 'D' } },
//    //   { lhs: Set(2) { 'B', 'C' }, rhs: Set(1) { 'B' } },
//    //   { lhs: Set(2) { 'B', 'C' }, rhs: Set(1) { 'D' } },
//    //   { lhs: Set(2) { 'B', 'D' }, rhs: Set(1) { 'B' } },
//    //   { lhs: Set(2) { 'B', 'D' }, rhs: Set(1) { 'C' } },
//    //   { lhs: Set(2) { 'C', 'D' }, rhs: Set(1) { 'C' } },
//    //   { lhs: Set(3) { 'B', 'C', 'D' }, rhs: Set(1) { 'B' } },
//    //   { lhs: Set(1) { 'C' }, rhs: Set(1) { 'C' } },
//    //   { lhs: Set(1) { 'D' }, rhs: Set(1) { 'D' } },
//    //   { lhs: Set(1) { 'C' }, rhs: Set(1) { 'D' } },
//    //   { lhs: Set(2) { 'B', 'C' }, rhs: Set(1) { 'C' } },
//    //   { lhs: Set(2) { 'C', 'D' }, rhs: Set(1) { 'D' } },
//    //   { lhs: Set(2) { 'B', 'D' }, rhs: Set(1) { 'D' } },
//    //
//    //   { lhs: Set(1) { 'B' }, rhs: Set(1) { 'D' } },
//    // { lhs: Set(1) { 'C' }, rhs: Set(1) { 'D' } },
//    // { lhs: Set(2) { 'B', 'D' }, rhs: Set(1) { 'C' } }



//    // step 4
//    for (const fd of result_fds) {
//      const new_fds = new Set(result_fds)

//      new_fds.delete(fd)

//      if (this.check_fds_are_equivalent(result_fds, new_fds)) {
//        result_fds = new_fds
//      }
//    }

//    return result_fds
//  }

//  /**
//   * find all the keys
//   *
//   * @param {Set<Fd>} fds - functional dependencies
//   * @returns Set<Set<string>>
//   */
//  find_all_keys(fds = this.fds) {
//    const number_of_attributes = this.attributes.size
//    const binary_expressions = []

//    for (let i = 1; i < 2 ** number_of_attributes; i++) {
//      const expression = []
//      let number = i
//      for (let j = 0; j < number_of_attributes; j++) {
//        expression.push(number % 2)
//        number = number >> 1
//      }
//      binary_expressions.push(expression)
//    }

//    binary_expressions.sort((a, b) => {
//      const sum_of_elements_in_a = a.reduce((sum, element) => sum + element, 0)
//      const sum_of_elements_in_b = b.reduce((sum, element) => sum + element, 0)
//      return sum_of_elements_in_a - sum_of_elements_in_b
//    })

//    const keys = new Set()
//    const U = [...this.attributes]

//    for (const expression of binary_expressions) {
//      const X = new Set()

//      for (let i = 0; i < number_of_attributes; i++) {
//        if (expression[i] === 1) {
//          X.add(U[i])
//        }
//      }

//      const Xplus = this.find_closure_of_attributes(X, fds)
//      if (
//        set_operation.is_superset(Xplus, this.attributes) &&
//        set_operation.every(keys, key => !set_operation.is_superset(X, key))
//      ) {
//        keys.add(X)
//      }
//    }

//    return keys
//  }

//  /**
//   * check whether the scheme is in 3NF
//   *
//   * @param {Set<Fd>} [fds] - functional dependencies
//   * @returns {boolean}
//   */
//  is_in_3NF(fds = this.fds) {
//    const minimal_cover = this.find_minimal_cover(fds)
//    const keys = this.find_all_keys(fds)
//    const prime_attributes = new Set(
//      [...keys].reduce(
//        (union, key) => set_operation.union(union, key),
//        new Set()
//      )
//    )

//    for (const fd of minimal_cover) {
//      const X = fd.lhs
//      const A = [...fd.rhs][0] // fd.rhs is a singleton because the fd is in the minimal cover
//      const Xplus = this.find_closure_of_attributes(X, fds)
//      if (
//        !set_operation.is_superset(Xplus, this.attributes) && // X is not a superkey
//        !prime_attributes.has(A) // A is not a prime attribute
//      ) {
//        return false
//      }
//    }

//    return true
//  }

//  /**
//   * check whether the scheme is in BCNF
//   *
//   * @param {Set<Fd>} [fds] - functional dependencies
//   * @returns {boolean}
//   */
//  is_in_BCNF(fds = this.fds) {
//    const minimal_cover = this.find_minimal_cover(fds)

//    for (const fd of minimal_cover) {
//      const X = fd.lhs
//      const Xplus = this.find_closure_of_attributes(X, fds)
//      if (
//        !set_operation.is_superset(Xplus, this.attributes) // X is not a superkey
//      ) {
//        return false
//      }
//    }

//    return true
//  }

//  /**
//   * find a projection of a fd set for a subset
//   *
//   * @param {Set<string>} subset - attributes
//   * @param {Set<Fd>} [fds] - functional dependencies
//   * @throws {RangeError} - thrown if subset is not included in this.attributes
//   * @returns {Set<Fd>}
//   */
//  get_projection(subset, fds = this.fds) {
//    if (!(set_operation.is_superset(this.attributes, subset))) {
//      throw new RangeError('[' + [...subset] + '] is not included in [' + this.attributes + '].')
//    }

//    const number_of_attributes = subset.size
//    const binary_expressions = []

//    for (let i = 1; i < 2 ** number_of_attributes; i++) {
//      const expression = []
//      let number = i
//      for (let j = 0; j < number_of_attributes; j++) {
//        expression.push(number % 2)
//        number = number >> 1
//      }
//      binary_expressions.push(expression)
//    }

//    let result = new Set()
//    const Z = [...subset]

//    for (const expression of binary_expressions) {
//      const X = new Set()

//      for (let i = 0; i < number_of_attributes; i++) {
//        if (expression[i] === 1) {
//          X.add(Z[i])
//        }
//      }

//      const Xplus = this.find_closure_of_attributes(X, fds)
//      const rhs = set_operation.intersection(Xplus, subset)
//      result.add({ lhs: X, rhs: rhs })
//    }

//    // NOTE: 
//    // Strictly speaking, the minimal cover when the entire attribute set is restricted to
//    // `subset` should be returned, but this is not a problem because the same result is
//    // returned without the restriction. (See the code find_minimal_cover()()()()()()()()() )
//    // console.log('before')
//    // console.log(result)
//    result = this.find_minimal_cover(result)
//    // console.log('after')
//    // console.log(result)
//    return result
//  }
//}

///**
// * check two fd relation schemes are the same
// *
// * @param {FdRelationScheme} R1 - fd relation scheme
// * @param {FdRelationScheme} R2 - fd relation scheme
// * @returns {boolean}
// */
//function is_equivalent(R1, R2) {
//  if (R1.name !== R2.name) {
//    return false
//  }

//  if (!(set_operation.is_equal(R1.attributes, R2.attributes))) {
//    return false
//  }

//  if (!(R1.check_fds_are_equivalent(R2.fds))) {
//    return false
//  }

//  return true
//}

///**
// * synthesize a given fd relation scheme into a 3NF database scheme
// *
// * @param {FdRelationScheme} R1 - fd relation scheme
// * @return {Set<FdRelationScheme>}
// */
//function synthesize_into_3NF(R1) {
//  // step 1
//  const minimal_cover = R1.find_minimal_cover()

//  console.log(minimal_cover)

//  // step 2
//  /** @type {Map<string, Set<string>>} */
//  const synthesis = new Map()
//  for (const fd of minimal_cover) {
//    const X = fd.lhs
//    const stringified = JSON.stringify([...X].sort())
//    if (!(synthesis.has(stringified))) {
//      synthesis.set(stringified, X)
//    }
//    for (const A of fd.rhs) {
//      synthesis.get(stringified).add(A)
//    }
//  }

//  // step 3
//  let is_key_contained = false
//  const keys = R1.find_all_keys()
//  for (const key of keys) {
//    for (const relation_attributes of synthesis.values()) {
//      if (set_operation.is_superset(relation_attributes, key)) {
//        is_key_contained = true
//      }
//    }
//  }
//  const some_key = [...keys][0]
//  if (!is_key_contained) {
//    const key_stringified = JSON.stringify([...some_key].sort())
//    synthesis.set(key_stringified, some_key)
//  }

//  // step 4
//  for (const [key, relation_attributes] of synthesis) {
//    for (const [another_key, another_relation_attributes] of synthesis) {
//      if (key === another_key) {
//        continue
//      }
//      if (relation_attributes.size > another_relation_attributes.size) {
//        continue
//      }
//      if (set_operation.is_superset(another_relation_attributes, relation_attributes)) {
//        synthesis.delete(key)
//        break
//      }

//    }
//  }

//  // output
//  const result = new Set()
//  let i = 1
//  for (const relation_attributes of synthesis.values()) {

//    result.add(new FdRelationScheme(
//      R1.name + '_' + i,
//      relation_attributes,
//      R1.get_projection(relation_attributes)
//    ))

//    ++i
//  }

//  return result
//}

//// const A = new Set(['a', 'b',     'c'])
//// const B = new Set(['b',
//// 'c', 'a'])

//// console.log(A)
//// console.log(B)

//// const stringified_A = JSON.stringify([...A].sort())
//// const stringified_B = JSON.stringify([...B].sort())

//// console.log(stringified_A)
//// console.log(stringified_B)

//// console.log(stringified_A === stringified_B)




//module.exports = {
//  FdRelationScheme,
//  is_equivalent,
//  synthesize_into_3NF
//}
