'use strict'

const FDRS = require('../index')
const FdRelationScheme = FDRS.FdRelationScheme
const set_operation = require('../lib/util').set_operation

test('generate a fd', () => {
  function throw_type_error1() {
    const hoge = 's'
    FDRS.generate_fd(hoge)
  }

  expect(throw_type_error1).toThrowError(TypeError)

  function throw_range_error() {
    const fd = ['a']
    FDRS.generate_fd(fd)
  }

  expect(throw_range_error).toThrowError(RangeError)

  function throw_type_error2() {
    const fd = ['fd', ['s']]
    FDRS.generate_fd(fd)
  }

  expect(throw_type_error2).toThrowError(TypeError)

  function throw_type_error3() {
    const fd = [['s'], 'fd']
    FDRS.generate_fd(fd)
  }

  expect(throw_type_error3).toThrowError(TypeError)

  const fd1 = [['A', 'B', 'jjj', 'B'], ['C', 'ff', 'jjj']]
  const fd2 = [['jjj', 'B', 'A', 'B', 'A'], ['ff', 'jjj', 'C']]

  expect(FDRS.generate_fd(fd1)).toBe(FDRS.generate_fd(fd2))
});

test('generate a fd relation scheme', () => {
  const test_relation_scheme = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      [['A', 'B'], ['C']]
    ]
  )

  expect(JSON.parse([...test_relation_scheme.fds][0])).toStrictEqual([['A', 'B'], ['C']])

  function throw_range_error() {
    const test_relation_scheme2 = new FdRelationScheme(
      'test2',
      ['A', 'B', 'C'],
      [
        [['A', 'B'], ['C']],
        [['C'], ['D']]
      ]
    )
  }

  expect(throw_range_error).toThrowError(RangeError)

})

test('Find the closure of attributes', () => {
  const R1 = new FdRelationScheme(
    'test_closure',
    ['A', 'B', 'C'],
    [
      [['A', 'B'], ['C']],
      [['C'], ['A']]
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
      [['A', 'B'], ['C']],
      [['C'], ['B']],
      [['A'], ['B']]
    ]
  )

  expect(R1.check_fds_are_equivalent([
    [['A'], ['C']],
    [['C'], ['B']]
  ])).toBe(true)

})

test('check the fds of a scheme is a minimal cover', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      [['A', 'B'], ['C']],
      [['C'], ['D']]
    ]
  )

  expect(R1.is_minimal()).toBe(true)

  const R2 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      [['A', 'B'], ['C', 'D']],
      [['C'], ['D']]
    ]
  )

  expect(R2.is_minimal()).toBe(false)

})

test('Find a minimal cover', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D'],
    [
      [['A', 'B'], ['C', 'D']],
      [['C'], ['D']]
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
      [['A'], ['B', 'C']],
      [['B'], ['C']],
      [['C'], ['B']]
    ]
  )

  const R4 = new FdRelationScheme(
    R3.name,
    R3.attributes,
    R3.find_minimal_cover()
  )

  expect(R3.is_minimal()).toBe(false)
  expect(R4.is_minimal()).toBe(true)

  const R5 = new FdRelationScheme(
    'test4minimal',
    ['B', 'C', 'D'],
    [
      [['B'], ['B', 'C', 'D']],
      [['C'], ['C']],
      [['B', 'C'], ['B', 'C', 'D']],
      [['D'], ['D']],
      [['B', 'D'], ['B', 'C', 'D']],
      [['C', 'D'], ['C', 'D']],
      [['B', 'C', 'D'], ['B', 'C', 'D']]
    ]
  )

  const R6 = new FdRelationScheme(
    R5.name,
    R5.attributes,
    R5.find_minimal_cover()
  )

  expect(R5.is_minimal()).toBe(false)
  expect(R6.is_minimal()).toBe(true)

  expect(R5.check_fds_are_equivalent(R5.find_minimal_cover())).toBe(true)
})

test('Find all the keys', () => {
  const R1 = new FdRelationScheme(
    'test',
    ['A', 'B', 'C', 'D', 'E'],
    [
      [['A'], ['C']],
      [['B'], ['C', 'D']],
      [['C'], ['E']],
      [['E'], ['C']],
      [['D'], ['B']]
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
      [['I', 'A'], ['S']],
      [['S'], ['A']],
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
      [['A', 'B'], ['D']],
      [['B'], ['C']],
    ]
  )

  expect(R1.is_in_3NF()).toBe(false)

  const R2 = new FdRelationScheme(
    'test2',
    ['A', 'B', 'C'],
    [
      [['A', 'B'], ['C']],
    ]
  )

  const R3 = new FdRelationScheme(
    'test3',
    ['A', 'B'],
    [
      [['A'], ['B']],
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
      [['A', 'B'], ['C']],
      [['C'], ['B']],
    ]
  )

  expect(R1.is_in_3NF()).toBe(true)
  expect(R1.is_in_BCNF()).toBe(false)

  const R2 = new FdRelationScheme(
    'test_bcnf2',
    ['A', 'B', 'C', 'D'],
    [
      [['A'], ['B']],
      [['A'], ['C']],
      [['A'], ['D']],
    ]
  )

  expect(R2.is_in_3NF()).toBe(true)
  expect(R2.is_in_BCNF()).toBe(true)
})

test('projection check', () => {
  const R1 = new FdRelationScheme(
    'projection_check',
    ['A', 'B', 'C'],
    [
      [['A'], ['B']],
      [['B'], ['C']],
      [['C'], ['A']],
    ]
  )

  const projection = R1.get_projection(new Set(['A', 'B']))

  const projected_relation_scheme = new FdRelationScheme(
    'projection_to_AB',
    ['A', 'B'],
    [
      [['A'], ['B']],
      [['B'], ['A']],
    ]
  )

  expect(projected_relation_scheme.check_fds_are_equivalent(projection))
})

test('Are relation schemes obtained by synthesis in 3NF?', () => {
  const R1 = new FdRelationScheme(
    'synthesis_check',
    ['A', 'B', 'C', 'D', 'E'],
    [
      [['A'], ['C']],
      [['B'], ['C', 'D']],
      [['C'], ['E']],
      [['E'], ['C']],
      [['D'], ['B']]
    ]
  )

  const schemes = FDRS.synthesize_into_3NF(R1)


  for (const scheme of schemes) {
    expect(scheme.is_in_3NF()).toBe(true)
  }

})

test('Are relation schemes obtained by synthesis functional dependency preserving decomposition?', () => {
  const R1 = new FdRelationScheme(
    'synthesis_check',
    ['A', 'B', 'C', 'D', 'E'],
    [
      [['A'], ['C']],
      [['B'], ['C', 'D']],
      [['C'], ['E']],
      [['E'], ['C']],
      [['D'], ['B']]
    ]
  )

  const schemes = FDRS.synthesize_into_3NF(R1)

  const union_of_projections = new Set()
  for (const scheme of schemes) {
    set_operation.union(union_of_projections, scheme.fds)
  }

  R1.check_fds_are_equivalent(union_of_projections)
})
