const {determineType} = require('./helpers');
const {instanceToObject, instanceToJSON} = require('./converter');
const {createSchema, createMix, describeValue, buildDescription} = require('./description');
const {checkValue, buildValue} = require('./instance');

const storage = require('./storage');

function findModelOfInstance(instance, models) {
    for (const Model of models.values()) {
        if (instance instanceof Model) {
            return Model;
        }
    }
}

class Sever {
    constructor() {
        const models = new Map();

        this.schema = (...objects) => createSchema(objects);

        this.mix = (...types) => createMix(types);

        this.value = (type = '', options = {}) => describeValue(type, options, models);

        this.model = (name = '', schema = {}) => {
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

            this.model[name] = Model;
            models.set(name, Model);

            return Model;
        };

        this.toObject = (instance = {}) => {
            const Model = findModelOfInstance(instance, models);
            if (Model) {
                return instanceToObject(instance, Model.getDescription());
            }
            throw new Error('Object is not an instance of any model.');
        };

        this.toJSON = (instance = {}, options = {}) => {
            const Model = findModelOfInstance(instance, models);
            if (Model) {
                return instanceToJSON(instance, Model.getDescription(), options);
            }
            throw new Error('Object is not an instance of any model.');
        };

        Object.freeze(this);
    }

    static schema(...objects) {}

    static mix(...types) {}

    static value(type = '', options = {}) {}

    static model(name = '', schema = {}) {}

    static toObject(instance = {}) {}

    static toJSON(instance = {}, options = {}) {}
}

const globalSever = new Sever();

Object.assign(Sever, globalSever);
Object.freeze(Sever);

module.exports = Sever;
