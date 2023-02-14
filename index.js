'use strict'

const util = require('./lib/util')
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

    // step 2.5 (for efficiency, remove trivial fds)
    for (const fd of result_fds) {
      const array_fd = get_as_object(fd)
      const X = new Set(array_fd[0])
      const Y = new Set(array_fd[1])
      if (set_operation.is_superset(X, Y)) {
        result_fds.delete(fd)
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
   * find one key
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @param {Set<string>} [superkey] - functional dependencies
   * @returns Set<string>
   */
  find_one_key(fds = this.fds, superkey = this.attributes) {
    let result = new Set(superkey)
    for (const A of superkey) {
      const X = new Set(result)
      X.delete(A)
      const Xplus = this.find_closure_of_attributes(X, fds)
      if (set_operation.is_superset(Xplus, this.attributes)) { // if X is a superkey
        result = X
      }
    }

    return result
  }


  /**
   * find all the keys
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns Set<Set<string>>
   */
  find_all_keys(fds = this.fds) {
    const result = new Set()
    result.add(this.find_one_key(fds))
    for (const key of result) {
      for (const fd of fds) {
        const array_fd = get_as_object(fd)
        const X = new Set(array_fd[0])
        const Y = new Set(array_fd[1])
        const S = set_operation.union(X, set_operation.difference(key, Y))
        let test = true
        for (const key2 of result) {
          if (set_operation.is_superset(S, key2)) {
            test = false
          }
        }
        if (test) {
          result.add(this.find_one_key(fds, S))
        }
      }
    }

    return result
  }

  /**
   * check whether the scheme is in 2NF
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_in_2NF(fds = this.fds) {
    const keys = this.find_all_keys(fds)
    const prime_attributes = new Set(
      [...keys].reduce(
        (union, key) => set_operation.union(union, key),
        new Set()
      )
    )
    const non_prime_attributes = set_operation.difference(this.attributes, prime_attributes)
    for (const A of non_prime_attributes) {
      for (const key of keys) {
        for (const attribute of key) {
          const X = new Set(key)
          X.delete(attribute)
          const Xplus = this.find_closure_of_attributes(X, fds)
          if (Xplus.has(A)) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * check whether the scheme is in 3NF
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_in_3NF(fds = this.fds) {
    const keys = this.find_all_keys(fds)
    const prime_attributes = new Set(
      [...keys].reduce(
        (union, key) => set_operation.union(union, key),
        new Set()
      )
    )

    for (const fd of fds) {
      const array_fd = get_as_object(fd)
      const X = new Set(array_fd[0])
      const Y = new Set(array_fd[1])
      if (set_operation.every(Y, A => X.has(A) || prime_attributes.has(A))) {
        continue
      }
      const Xplus = this.find_closure_of_attributes(X, fds)
      if (!set_operation.is_superset(Xplus, this.attributes)) {
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
    for (const fd of fds) {
      const array_fd = get_as_object(fd)
      const X = new Set(array_fd[0])
      const Y = new Set(array_fd[1])
      if (set_operation.every(Y, A => X.has(A))) { // i.e. X includes Y
        continue
      }
      const Xplus = this.find_closure_of_attributes(X, fds)
      if (!set_operation.is_superset(Xplus, this.attributes)) { // X is not a superkey
        return false
      }
    }

    return true
  }

  /**
   * check whether the scheme is in 4NF
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_guaranteed_in_4NF(fds = this.fds) {
    if (!this.is_in_BCNF()) {
      return false
    }

    const keys = this.find_all_keys(fds)

    const is_some_key_simple = set_operation.some(keys, key => key.size == 1)

    return is_some_key_simple
  }

  /**
   * check whether the scheme is in PJNF
   *
   * @param {Set<string>} [fds] - functional dependencies
   * @returns {boolean}
   */
  is_guaranteed_in_PJNF(fds = this.fds) {
    if (!this.is_in_BCNF()) {
      return false
    }

    const keys = this.find_all_keys(fds)

    const is_every_key_simple = set_operation.every(keys, key => key.size == 1)

    return is_every_key_simple
  }

  /**
   * find a projection of a fd set for a subset
   *
   * @param {Set<string>} subset - attributes
   * @param {boolean} should_minimize - if true, returned fds are minimixed.
   * @param {Set<string>} [fds] - functional dependencies
   * @throws {RangeError} - thrown if subset is not included in this.attributes
   * @returns {Set<string>}
   */
  get_projection(subset, should_minimize = true, fds = this.fds) {
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

    if (should_minimize) {
      // NOTE:
      // Strictly speaking, the minimal cover when the entire attribute set is restricted to
      // `subset` should be returned, but this is not a problem because the same result is
      // returned without the restriction. (See the code find_minimal_cover().)
      result = this.find_minimal_cover(result)
    }
    return result
  }

}

/**
 * synthesize a given fd relation scheme into a 3NF database scheme
 *
 * @param {FdRelationScheme} R1 - fd relation scheme
 * @return {Set<FdRelationScheme>}
 */
function synthesize_into_3NF(R1) {
  // step 1
  const minimal_cover = R1.find_minimal_cover()

  // step 2
  /** @type {Map<string, Set<string>>} */
  const synthesis = new Map()
  for (const fd of minimal_cover) {
    const array_fd = get_as_object(fd)
    const X = array_fd[0]

    const stringified_X = JSON.stringify(X)
    if (!(synthesis.has(stringified_X))) {
      synthesis.set(stringified_X, X)
    }
    for (const A of array_fd[1]) {
      synthesis.get(stringified_X).push(A)
    }
  }

  // step 3
  let is_key_contained = false
  const keys = R1.find_all_keys()
  check_key_is_contained: for (const key of keys) {
    for (const relation_attributes of synthesis.values()) {
      if (set_operation.is_superset(new Set(relation_attributes), key)) {
        is_key_contained = true
        break check_key_is_contained
      }
    }
  }
  const some_key = [...[...keys][0]]
  if (!is_key_contained) {
    const key_stringified = JSON.stringify(some_key.sort())
    synthesis.set(key_stringified, some_key)
  }

  // step 4
  for (const [key, relation_attributes] of synthesis) {
    for (const [another_key, another_relation_attributes] of synthesis) {
      if (key === another_key) {
        continue
      }
      if (relation_attributes.size > another_relation_attributes.size) {
        continue
      }
      if (set_operation.is_superset(new Set(another_relation_attributes), new Set(relation_attributes))) {
        synthesis.delete(key)
        break
      }

    }
  }

  // output
  const result = new Set()
  let i = 1
  for (const relation_attributes of synthesis.values()) {

    result.add(new FdRelationScheme(
      R1.name + '_' + i,
      relation_attributes,
      R1.get_projection(new Set(relation_attributes))
    ))

    ++i
  }

  return result
}

module.exports = {
  generate_fd,
  FdRelationScheme,
  synthesize_into_3NF
}
