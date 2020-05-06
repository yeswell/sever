const reserved = {
    types: [
        'any',
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
    types: new Set(reserved.types),
    names: new Set(reserved.names),
    models: new Map()
};

module.exports = storage;
