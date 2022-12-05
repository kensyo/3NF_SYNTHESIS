'use strict'

const synthesis = require('../index')

test('sample test', () => {
  expect(synthesis.find_minimal_cover("hoge")).toBe("hoge")
});
