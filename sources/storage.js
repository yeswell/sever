const reserved = {
    strategies: [
        'any',
        'all',
        'one',
        'not'
    ],
    types: [
        'boolean',
        'number',
        'bigint',
        'string',
        'array',
        'object',
        'date',
        'symbol',
        'regexp',
        'function',
        'class',
        'model',
        'any',
        'mix'
    ],
    names: [
        'null',
        'undefined',
        'create',
        'check',
        'getName',
        'getDescription',
        'toObject',
        'toJSON',
        'length',
        'name',
        'arguments',
        'caller',
        'prototype'
    ]
};

const storage = {
    strategies: new Set(reserved.strategies),
    types: new Set(reserved.types),
    names: new Set(reserved.names),
    models: new Map()
};

module.exports = storage;
