const {determineType} = require('./helpers');
const {instanceToObject, instanceToJSON} = require('./converter');
const {createSchema, createMix, describeValue, buildDescription} = require('./description');
const {checkValue, buildValue} = require('./instance');

const storage = require('./storage');
const models = new Map();

function schema(...objects) {
    return createSchema(objects);
}

function mix(...types) {
    return createMix(types);
}

function value(type = '', options = {}) {
    return describeValue(type, options,  models);
}

function model(name = '', schema = {}) {
    const nameType = determineType(name);
    if (nameType !== 'string') {
        throw new Error('Model name must be a string.');
    } else if (models.has(name)) {
        throw new Error(`Model "${name}" is already exist.`);
    } else if (storage.types.has(name) || storage.names.has(name)) {
        throw new Error(`Model name "${name}" is invalid.`);
    }

    const description = buildDescription(schema, models);

    class Model {
        constructor(object = {}) {
            const checkResult = Model.check(object);
            if (!checkResult) {
                throw new Error('Invalid object.');
            }
            const instance = buildValue(object, description, models);
            if (instance === undefined) {
                throw new Error('Invalid object.');
            }
            Object.assign(this, instance);
        }
        static create(object = {}) {
            return new Model(object);
        }
        static check(object = {}) {
            if (object instanceof Model) {
                return true;
            }
            return checkValue(object, description);
        }
        static getName() {
            return name;
        }
        static getDescription() {
            return description;
        }
        static toObject(instance = {}) {
            if (instance instanceof Model) {
                return instanceToObject(instance, description);
            }
            throw new Error(`Object is not an instance of the model "${name}".`);
        }
        static toJSON(instance = {}, options = {}) {
            if (instance instanceof Model) {
                return instanceToJSON(instance, description, options);
            }
            throw new Error(`Object is not an instance of the model "${name}".`);
        }
    }

    Object.defineProperty(Model.prototype.constructor, 'name', {value: name});
    Object.freeze(Model);

    model[name] = Model;
    models.set(name, Model);

    return Model;
}

function findModelOfInstance(instance) {
    for (const Model of models.values()) {
        if (instance instanceof Model) {
            return Model;
        }
    }
}

function toObject(instance = {}) {
    const Model = findModelOfInstance(instance);
    if (Model) {
        return instanceToObject(instance, Model.getDescription());
    }
    throw new Error('Object is not an instance of any model.');
}

function toJSON(instance = {}, options = {}) {
    const Model = findModelOfInstance(instance);
    if (Model) {
        return instanceToJSON(instance, Model.getDescription(), options);
    }
    throw new Error('Object is not an instance of any model.');
}

module.exports = {schema, mix, value, model, toObject, toJSON};
