'use strict';

const FDRS = require('../lib/FdRelationScheme');
const FdRelationScheme = FDRS.FdRelationScheme;
const Fd = FDRS.Fd;

test('sample relation test', () => {
    const test_relation_scheme = new FdRelationScheme(
        "test",
        ["A", "B", "C"],
        [new Fd(["A", "B"], ["C"]), new Fd(["C"], ["A"])]
    );

    expect(test_relation_scheme.fds[0]).toStrictEqual(new Fd(["A", "B"], ["C"]));
});

test('Fd range test', () => {
    function throwRangeError() {
        const test_relation_scheme = new FdRelationScheme(
            "test",
            ["A", "B", "C"],
            [new Fd(["A", "B"], ["C"]), new Fd(["C"], ["D"])]
        );
    }

    expect(throwRangeError).toThrowError(RangeError);
})
