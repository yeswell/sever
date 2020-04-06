function getType(value) {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    const type = typeof (value);
    const types = new Set(['boolean', 'number', 'string', 'object']);
    if (types.has(type)) {
        return type;
    }
    return 'unknown';
}

module.exports = {getType};
