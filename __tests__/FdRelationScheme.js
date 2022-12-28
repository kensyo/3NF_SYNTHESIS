'use strict'

const FDRS = require('../lib/FdRelationScheme')
const FdRelationScheme = FDRS.FdRelationScheme
const set_operation = require('../lib/util').set_operation

test('sample relation test', () => {
  const fd = { lhs: new Set(['A', 'B']), rhs: new Set(['C']) }
  const test_relation_scheme = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      fd,
      { lhs: new Set(['C']), rhs: new Set(['A']) }
    ]
  )

  expect(Array.from(test_relation_scheme.fds)[0]).toStrictEqual({ lhs: new Set(['A', 'B']), rhs: new Set(['C']) })
});

test('Fd range test', () => {
  function throw_range_error() {
    const test_relation_scheme = new FdRelationScheme(
      'test',
      ['A', 'B', 'C'],
      [
        { lhs: ['A', 'B'], rhs: ['C'] },
        { lhs: ['C'], rhs: ['D'] }
      ]
    )
  }

  expect(throw_range_error).toThrowError(RangeError)
})

test('Find the closure of a determinant(lhs))', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['A'] }
    ]
  )

  expect(R1.find_closure_of_attributes(['A', 'B'])).toStrictEqual(new Set(['A', 'B', 'C']))
  expect(R1.find_closure_of_attributes(['C'])).toStrictEqual(new Set(['A', 'C']))
})

test('Check if a given fds is equivalent to the original', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] },
      { lhs: ['A'], rhs: ['B'] }
    ]
  )

  expect(R1.check_fds_are_equivalent([
    { lhs: ['A'], rhs: ['C'] },
    { lhs: ['C'], rhs: ['B'] }
  ])).toBe(true)

})

test('Check if two relation schemes are equivalent', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] },
      { lhs: ['A'], rhs: ['B'] }
    ]
  )

  const R2 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] }
    ]
  )


  const R3 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
    ]
  )

  expect(FDRS.is_equivalent(R1, R2)).toBe(true)
  expect(FDRS.is_equivalent(R1, R3)).toBe(false)

  const R4 = new FdRelationScheme(
    'tttt',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
    ]
  )

  const R5 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
    ]
  )

  expect(FDRS.is_equivalent(R3, R4)).toBe(false)
  expect(FDRS.is_equivalent(R3, R5)).toBe(false)
})

test('check the fds of a scheme is a minimal cover', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['D'] }
    ]
  )

  expect(R1.is_minimal()).toBe(true)

  const R2 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      { lhs: ['A', 'B'], rhs: ['C', 'D'] },
      { lhs: ['C'], rhs: ['D'] }
    ]
  )

  expect(R2.is_minimal()).toBe(false)

})

test('Find a minimal cover', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      { lhs: ['A', 'B'], rhs: ['C', 'D'] },
      { lhs: ['C'], rhs: ['D'] }
    ]
  )

  expect(R1.is_minimal()).toBe(false)

  const minimal_cover_of_R1 = R1.find_minimal_cover()

  const R2 = new FdRelationScheme(
    R1.name,
    R1.attributes,
    minimal_cover_of_R1
  )

  expect(R1.is_minimal()).toBe(false)
  expect(R2.is_minimal()).toBe(true)

  const R3 = new FdRelationScheme(
    'test2',
    ['A', 'B', 'C'],
    [
      { lhs: ['A'], rhs: ['B', 'C'] },
      { lhs: ['B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] }
    ]
  )

  const R4 = new FdRelationScheme(
    R3.name,
    R3.attributes,
    R3.find_minimal_cover()
  )

  expect(R3.is_minimal()).toBe(false)
  expect(R4.is_minimal()).toBe(true)
})

test('Find all the keys', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D', 'E'],
    [
      { lhs: ['A'], rhs: ['C'] },
      { lhs: ['B'], rhs: ['C', 'D'] },
      { lhs: ['C'], rhs: ['E'] },
      { lhs: ['E'], rhs: ['C'] },
      { lhs: ['D'], rhs: ['B'] }
    ]
  )

  const keys = R1.find_all_keys()

  expect(keys.size).toBe(2)

  for (const key of keys) {
    expect(
      set_operation.is_equal(key, new Set(['A', 'B'])) ||
      set_operation.is_equal(key, new Set(['A', 'D']))
    ).toBe(true)
  }

  const keys_array = [...keys]
  expect(set_operation.is_equal(keys_array[0], keys_array[1])).toBe(false)

  const R2 = new FdRelationScheme(
    'test2',
    ['I', 'A', 'S'],
    [
      { lhs: ['I', 'A'], rhs: ['S'] },
      { lhs: ['S'], rhs: ['A'] },
    ]
  )

  const keys2 = R2.find_all_keys()

  expect(keys2.size).toBe(2)

  for (const key of keys2) {
    expect(
      set_operation.is_equal(key, new Set(['I', 'A'])) ||
      set_operation.is_equal(key, new Set(['I', 'S']))
    ).toBe(true)
  }

  const keys2_array = [...keys2]
  expect(set_operation.is_equal(keys2_array[0], keys2_array[1])).toBe(false)
})

test('Is in 3NF?', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      { lhs: ['A', 'B'], rhs: ['D'] },
      { lhs: ['B'], rhs: ['C'] },
    ]
  )

  expect(R1.is_in_3NF()).toBe(false)

  const R2 = new FdRelationScheme(
    'test2',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
    ]
  )

  const R3 = new FdRelationScheme(
    'test3',
    ['A', 'B'],
    [
      { lhs: ['A'], rhs: ['B'] },
    ]
  )

  expect(R2.is_in_3NF()).toBe(true)
  expect(R3.is_in_3NF()).toBe(true)

})

test('Is in BCNF?', () => {
  const R1 = new FdRelationScheme(
    'test_bcnf',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['B'] },
    ]
  )

  expect(R1.is_in_3NF()).toBe(true)
  expect(R1.is_in_BCNF()).toBe(false)
})
