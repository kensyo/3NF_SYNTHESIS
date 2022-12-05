'use strict';

/**
 * Functional Dependency
 * @param {Array<string>} lhs left hand side
 * @param {Array<string>} rhs right hand side
 * @constructor
 */
class Fd {
    /**
     * @param {Array<string>} lhs left hand side
     * @param {Array<string>} rhs right hand side
     */
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
}

/**
 * Relation scheme with fds only
 * @param {string} name relation name
 * @param {Array<string>} attributes
 * @param {Array<Fd>} fds functional dependencies
 * @constructor
 */
class FdRelationScheme {
    /**
     * @param {string} name relation name
     * @param {Array<string>} attributes
     * @param {Array<Fd>} fds functional dependencies
     */
    constructor(name, attributes, fds) {
        this.name = name;
        this.attributes = attributes;
        for (const fd of fds) {
            for (const attribute of fd.lhs) {
                if (!attributes.includes(attribute)) {
                    throw new RangeError(attribute + " is not in " + attributes + ".");
                }
            }
            for (const attribute of fd.rhs) {
                if (!attributes.includes(attribute)) {
                    throw new RangeError(attribute + " is not in " + attributes + ".");
                }
            }
        }
        this.fds = fds;
    }
}

module.exports = {
    FdRelationScheme,
    Fd
}
