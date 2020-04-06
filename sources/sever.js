const {describeValue, buildDescription} = require('./description');
const {buildCheck, buildCreate} = require('./instance');

// Sever storage
const sever = {
    types: new Set(['any', 'object', 'array', 'string', 'number', 'boolean']),
    reserved: new Set(['null', 'undefined', 'unknown', 'integer', 'real', 'length', 'name', 'arguments', 'caller', 'prototype']),
    models: new Map()
};

function value(type = "", options = {}) {
    return describeValue(type, options, sever);
}

function model(name = "", schema = {}) {
    const namePattern = /^(?:[a-zA-Z0-9]|[a-zA-Z0-9][\w-.]*[a-zA-Z0-9])$/;

    if (!namePattern.test(name) || sever.types.has(name) || sever.reserved.has(name)) {
        throw new Error(`Model name "${name}" is invalid.`);
    }
    if (sever.models.has(name)) {
        throw new Error(`Model "${name}" is already exist.`);
    }

    const description = buildDescription(schema, sever);
    const check = buildCheck(description, sever.models);
    const create = buildCreate(check);

    class Model {
        constructor(object = {}) {
            const instance = create(object);
            Object.assign(this, instance);
        }
        static create(object = {}) {
            return new Model(object);
        }
        static check(object = {}) {
            return check(object);
        }
    }

    Object.defineProperty(Model.prototype.constructor, 'name', {value: name});
    Object.defineProperty(model, name, {value: Model});

    sever.models.set(name, Model);

    return Model;
}

module.exports = {value, model};
