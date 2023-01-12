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

const set_operation = {
  is_superset: function(set, subset) {
    for (let elem of subset) {
      if (!set.has(elem)) {
        return false
      }
    }
    return true
  },

  is_equal: function(setA, setB) {
    return setB.size === setA.size &&
      this.is_superset(setB, setA)
  },

  union: function(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
      _union.add(elem)
    }
    return _union
  },

  intersection: function(setA, setB) {
    let _intersection = new Set()
    for (let elem of setB) {
      if (setA.has(elem)) {
        _intersection.add(elem)
      }
    }
    return _intersection
  },

  symmetric_difference: function(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
      if (_difference.has(elem)) {
        _difference.delete(elem)
      } else {
        _difference.add(elem)
      }
    }
    return _difference
  },

  difference: function(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
      _difference.delete(elem)
    }
    return _difference
  },

  every: function(A, cond) {
    for (const elem of A) {
      if (!cond(elem)) {
        return false
      }
    }

    return true
  }
}

module.exports = {
  get_type,
  set_operation
}

// /**
//  * get a type
//  *
//  * @param {any} a - target
//  * @returns {string} lowercased type name
//  */
// function get_type(a) {
//   const type = Object.prototype.toString.call(a).slice(8, -1).toLowerCase()
//   return type
// }

// /**
//  * Borrow some functions from [a refference page]{@link https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Set}
//  */
// const set_operation = {
//   is_superset: function(set, subset) {
//     for (let elem of subset) {
//       if (!set.has(elem)) {
//         return false
//       }
//     }
//     return true
//   },

//   is_equal: function(setA, setB) {
//     return setB.size === setA.size &&
//       this.is_superset(setB, setA)
//   },

//   union: function(setA, setB) {
//     let _union = new Set(setA)
//     for (let elem of setB) {
//       _union.add(elem)
//     }
//     return _union
//   },

//   intersection: function(setA, setB) {
//     let _intersection = new Set()
//     for (let elem of setB) {
//       if (setA.has(elem)) {
//         _intersection.add(elem)
//       }
//     }
//     return _intersection
//   },

//   symmetric_difference: function(setA, setB) {
//     let _difference = new Set(setA)
//     for (let elem of setB) {
//       if (_difference.has(elem)) {
//         _difference.delete(elem)
//       } else {
//         _difference.add(elem)
//       }
//     }
//     return _difference
//   },

//   difference: function(setA, setB) {
//     let _difference = new Set(setA)
//     for (let elem of setB) {
//       _difference.delete(elem)
//     }
//     return _difference
//   },

//   every: function(A, cond) {
//     for (const elem of A) {
//       if (!cond(elem)) {
//         return false
//       }
//     }

//     return true
//   }
// }

// module.exports = {
//   get_type,
//   set_operation
// }
