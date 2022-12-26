'use strict'

const FDRS = require('../lib/FdRelationScheme')
const FdRelationScheme = FDRS.FdRelationScheme

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

  console.log(R2.fds)

})
