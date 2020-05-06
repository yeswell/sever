const {instanceToObject, instanceToJSON} = require('./converter');
const {createSchema, describeValue, buildDescription, ValueDescription} = require('./description');
const {buildCheck, buildCreate} = require('./instance');

const storage = require('./storage');

function schema(...objects) {
    return createSchema(...objects);
}

function value(type = '', options = {}) {
    return describeValue(type, options);
}

function model(name = '', schema = {}) {
    if (storage.types.has(name) || storage.names.has(name)) {
        throw new Error(`Model name "${name}" is invalid.`);
    }
    if (storage.models.has(name)) {
        throw new Error(`Model "${name}" is already exist.`);
    }

    const description = buildDescription(schema);
    const check = buildCheck(description);
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
            if (object instanceof Model) {
                return true;
            }
            return check(object);
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
    Object.defineProperty(model, name, {value: Model});

    storage.models.set(name, Model);

    return Model;
}

function toObject(instance = {}) {
    const Model = [...storage.models.values()].find(Model => (instance instanceof Model));
    if (Model) {
        return instanceToObject(instance, Model.getDescription());
    }
    throw new Error('Object is not an instance of any model.');
}

function toJSON(instance = {}, options = {}) {
    const Model = [...storage.models.values()].find(Model => (instance instanceof Model));
    if (Model) {
        return instanceToJSON(instance, Model.getDescription(), options);
    }
    throw new Error('Object is not an instance of any model.');
}

module.exports = {ValueDescription, schema, value, model, toObject, toJSON};
