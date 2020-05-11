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
    if (object instanceof Map) {
        return object;
    }
    const map = new Map();
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            map.set(key, object[key]);
        }
    }
    return map;
}

function createSchema(objects) {
    const schema = new Map();
    for (const source of objects) {
        const sourceType = determineType(source);
        if (sourceType !== 'object') {
            throw new Error('Arguments must be an objects.');
        }
        const map = transformObject(source);
        for (const [key, value] of map.entries()) {
            schema.set(key, value);
        }
    }
    return schema;
}

function createMix(types) {
    const set = new Set(types);
    return set;
}

function modelExist(source) {
    for (const Model of storage.models.values()) {
        if (Model === source) {
            return true;
        }
    }
    return false;
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
            if (storage.models.has(source)) {
                type = 'model';
                Object.assign(options, {model: storage.models.get(source)});
            } else if (storage.types.has(source)) {
                type = source;
            } else if (storage.names.has(source)) {
                throw new Error(`Forbidden to use reserved word "${source}" as type name.`);
            } else {
                throw new Error(`Unknown model "${source}".`);
            }
            break;
        case 'array':
            type = 'array';
            Object.assign(options, {items: source[0]});
            break;
        case 'object':
            if (source instanceof Set) {
                type = 'mix';
                Object.assign(options, {choices: source});
            } else {
                type = 'object';
                Object.assign(options, {schema: source});
            }
            break;
        case 'function':
            if (modelExist(source)) {
                type = 'model';
                Object.assign(options, {model: source});
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
            const map = transformObject(options.schema);
            if (map.size > 0) {
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
            } else {
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
            if (!modelExist(options.model)) {
                throw new Error('Property "model" in options must be some kind of Model.');
            }
            break;
        case 'mix':
            if (options.choices instanceof Set) {
                if (options.choices.size === 0) {
                    throw new Error('Required at least one type in mix.');
                }

                const choices = new FreezingSet();
                for (const value of options.choices.values()) {
                    const valueDescription = describeValue(value);
                    choices.add(valueDescription);
                }
                choices.freeze();
                options.choices = choices;
            } else {
                throw new Error('Property "choices" in options must be instance of Set.');
            }
            if (options.strategy) {
                if (!storage.strategies.has(options.strategy)) {
                    throw new Error(`Invalid strategy "${options.strategy}".`);
                }
            } else {
                options.strategy = 'any';
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

        this.hasDefault = (options.default !== undefined);
        if (this.hasDefault) {
            if (options.default instanceof Function) {
                this.getDefault = () => {
                    try {
                        return options.default();
                    } catch (e) {
                        return undefined;
                    }
                }
            } else {
                this.getDefault = () => {
                    return options.default;
                }
            }
        }

        this.hasValidator = true;
        if (options.validator instanceof RegExp) {
            this.isValid = value => {
                return options.validator.test(value);
            }
        } else if (options.validator instanceof Function) {
            this.isValid = value => {
                try {
                    return (options.validator(value) === true);
                } catch (e) {
                    return false;
                }
            };
        } else {
            this.hasValidator = false;
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
            case 'mix':
                this.choices = options.choices;
                this.strategy = options.strategy;
                break;
        }

        Object.freeze(this);
    }
}

module.exports = {buildDescription, createSchema, createMix, describeValue};
