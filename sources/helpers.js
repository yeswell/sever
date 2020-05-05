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

module.exports = {determineType};
