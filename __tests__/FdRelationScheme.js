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

test('Find a minimal cover', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['A'] }
    ]
  )

  const minimal_cover_of_R1 = R1.find_minimal_cover()

  const R2 = new FdRelationScheme(
    R1.name,
    R1.attributes,
    minimal_cover_of_R1
  )

  // step1
  expect(FDRS.is_equal(R1, R2)).toBe(true)
  // step2
  expect(R2.fds.every(fd => fd.rhs.length === 1)).toBe(true)

  // step3
  const deep_copy_of_minimal_cover_of_R1 = JSON.parse(JSON.stringify(minimal_cover_of_R1))
  for (const fd of deep_copy_of_minimal_cover_of_R1) {
    for (const attr of fd.lhs) {
      const original_lhs = fd.lhs
      const reduced_lhs = fd.lhs.filter(val => val !== attr)
      fd.lhs = reduced_lhs

      expect(R2.check_fds_are_equivalent(deep_copy_of_minimal_cover_of_R1)).toBe(false)

      fd.lhs = original_lhs
    }
  }

  // step4
  for (const fd of deep_copy_of_minimal_cover_of_R1) {
    const reduced_fds = deep_copy_of_minimal_cover_of_R1.filter(val => val !== fd)
    expect(R2.check_fds_are_equivalent(reduced_fds)).toBe(false)
  }
})
