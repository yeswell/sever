const strategies = [
    'any',
    'all',
    'one',
    'not'
];

const reserved = {
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
};

const storage = {
    strategies: new Set(strategies),
    names: new Set(reserved.names),
    types: new Set(reserved.types)
};

module.exports = storage;
