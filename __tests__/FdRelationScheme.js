'use strict'

const FDRS = require('../lib/FdRelationScheme')
const FdRelationScheme = FDRS.FdRelationScheme

test('sample relation test', () => {
  const test_relation_scheme = new FdRelationScheme(
    'test',
    ['A', 'B', 'C'],
    [
      { lhs: ['A', 'B'], rhs: ['C'] },
      { lhs: ['C'], rhs: ['A'] }
    ]
  )

  expect(test_relation_scheme.fds[0]).toStrictEqual({ lhs: ['A', 'B'], rhs: ['C'] })
});

test('Fd range test', () => {
  function throwRangeError() {
    const test_relation_scheme = new FdRelationScheme(
      'test',
      ['A', 'B', 'C'],
      [
        { lhs: ['A', 'B'], rhs: ['C'] },
        { lhs: ['C'], rhs: ['D'] }
      ]
    )
  }

  expect(throwRangeError).toThrowError(RangeError)
})
