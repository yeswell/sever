const {determineType, FreezingMap, FreezingSet} = require('./helpers');

const storage = require('./storage');

function buildDescription(schema) {
    const description = describeValue(schema);

    const topLevelTypes = new Set(['object', 'array']);
    if (!topLevelTypes.has(description.type)) {
        throw new Error('On top level schema must be an object or an array.');
    }
    if (description.allowNull) {
        throw new Error('On top level object or array cannot be a null.');
    }

    return description;
}

function transformClass(source) {
    switch (source) {
        case Boolean:
            return 'boolean';
        case Number:
            return 'number';
        case BigInt:
            return 'bigint';
        case String:
            return 'string';
        case Array:
            return 'array';
        case Object:
            return 'object';
        case Date:
            return 'date';
        case Symbol:
            return 'symbol';
        case RegExp:
            return 'regexp';
        case Function:
            return 'function';
        default:
            return source;
    }
}

function transformObject(object) {
    const map = new Map();
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            map.set(key, object[key]);
        }
    }
    return map;
}

function createSchema(...objects) {
    const schema = objects.reduce((map, source) => {
        const sourceType = determineType(source);
        if (sourceType === 'object') {
            const newMap = transformObject(source);
            const mergedMap = new Map([...map, ...newMap]);
            return mergedMap;
        } else {
            throw new Error('Arguments must be an objects.');
        }
    }, new Map());
    return schema;
}

function findModel(source) {
    const models = [...storage.models.values()];
    if (models.includes(source)) {
        return source;
    }
}

function describeValue(source, options) {
    if (source instanceof ValueDescription) {
        return source;
    }

    source = transformClass(source);
    const sourceType = determineType(source);

    let type = '';
    const optionsType = determineType(options);
    options = (optionsType === 'object') ? {...options} : {};

    switch (sourceType) {
        case 'string':
            type = source;
            if (storage.models.has(type)) {
                type = 'model';
                Object.assign(options, {model: storage.models.get(type)});
            } else if (storage.names.has(type)) {
                throw new Error(`Forbidden to use reserved word "${type}" as type name.`);
            } else if (!storage.types.has(type)) {
                throw new Error(`Unknown model "${type}".`);
            }
            break;
        case 'array':
            type = 'array';
            Object.assign(options, {items: source[0]});
            break;
        case 'object':
            type = 'object';
            Object.assign(options, {schema: source});
            break;
        case 'function':
            const Model = findModel(source);
            if (Model) {
                type = 'model';
                Object.assign(options, {model: Model});
            } else {
                type = 'class';
                Object.assign(options, {class: source});
            }
            break;
        default:
            throw new Error('Invalid schema.');
    }

    if (options.validator) {
        if (options.validator instanceof RegExp) {
            const typesValidatedByRegExp = new Set(['string', 'number']);
            if (!typesValidatedByRegExp.has(type)) {
                throw new Error('RegExp-validator can only be used with types "string" and "number".');
            }
        } else if (!(options.validator instanceof Function)) {
            throw new Error('Validator must be instance of Function or RegExp.');
        }
    }

    switch (type) {
        case 'array':
            if (options.items) {
                options.items = describeValue(options.items);
            } else {
                options.items = null;
            }
            break;
        case 'object':
            if (options.schema) {
                const map = (options.schema instanceof Map) ? options.schema : transformObject(options.schema);

                const allKeysAreStrings = [...map.keys()].every(key => (determineType(key) === 'string'));
                if (!allKeysAreStrings) {
                    throw new Error('All keys in Map-schema must be a string.');
                }

                const schema = new FreezingMap();
                for (const [key, value] of map.entries()) {
                    const patternKeyRegExp = new RegExp(/^\/\^.*\$\/$/);
                    if (patternKeyRegExp.test(key)) {
                        try {
                            new RegExp(key.slice(1, -1));
                        } catch (e) {
                            throw new Error(`RegExpKey "${key}" is invalid.`);
                        }
                    }
                    schema.set(key, describeValue(value));
                }
                schema.freeze();
                options.schema = schema;
            }
            if ((!options.schema) || (options.schema.size === 0)) {
                options.schema = null;
            }
            break;
        case 'class':
            const classType = determineType(options.class);
            if (classType !== 'function') {
                throw new Error('Property "class" in options must be instance of Function.');
            }
            break;
        case 'model':
            const Model = findModel(options.model);
            if (!Model) {
                throw new Error('Property "model" in options must be some kind of Model.');
            }
            break;
    }

    return new ValueDescription(type, options);
}

class ValueDescription {
    constructor(type, options) {
        this.type = type;
        this.required = (options.required !== false);
        this.matchOnce = (options.matchOnce === true);
        this.allowNull = (options.allowNull === true);
        this.noDefault = (options.default === undefined);

        let validator = () => true;
        if (options.validator instanceof RegExp) {
            validator = value => options.validator.test(value);
        } else if (options.validator instanceof Function) {
            validator = value => options.validator(value);
        }

        this.isValid = value => {
            try {
                return (validator(value) === true);
            } catch (e) {
                return false;
            }
        };

        if (!this.noDefault) {
            let generateDefault = () => options.default;
            if (options.default instanceof Function) {
                generateDefault = () => options.default()
            }

            this.getDefault = () => {
                try {
                    return generateDefault();
                } catch (e) {
                    return undefined;
                }
            }
        }

        switch (this.type) {
            case 'array':
                this.items = options.items;
                break;
            case 'object':
                this.schema = options.schema;
                break;
            case 'class':
                this.class = options.class;
                break;
            case 'model':
                this.model = options.model;
                break;
        }

        Object.freeze(this);
    }
}

module.exports = {buildDescription, createSchema, describeValue};
