function determineType(value) {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (value instanceof Array) {
        return 'array';
    }
    if (value instanceof Date) {
        return 'date';
    }
    if (value instanceof RegExp) {
        return 'regexp';
    }
    const types = new Set(['boolean', 'number', 'bigint', 'string', 'symbol', 'function']);
    const type = typeof value;
    if (types.has(type)) {
        return type;
    }
    return 'object';
}

class FreezingMap extends Map {
    constructor(...args) {
        super(...args);
        this.isFrozen = () => false;
    }
    freeze() {
        this.clear = () => {};
        this.delete = () => false;
        this.set = () => this;
        this.isFrozen = () => true;
        Object.freeze(this);
    }
}

class FreezingSet extends Set {
    constructor(...args) {
        super(...args);
        this.isFrozen = () => false;
    }
    freeze() {
        this.clear = () => {};
        this.delete = () => false;
        this.add = () => this;
        this.isFrozen = () => true;
        Object.freeze(this);
    }
}

module.exports = {determineType, FreezingMap, FreezingSet};
