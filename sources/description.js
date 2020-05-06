const {determineType} = require('./helpers');

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
    const sourceType = determineType(source);
    if (sourceType === 'string') {
        return source;
    }
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
            const Model = [...storage.models.values()].find(Model => (Model === source));
            if (Model) {
                return Model.getName();
            }
            return source;
    }
}

function describeValue(source, options) {
    if (source instanceof ValueDescription) {
        return source;
    }
    source = transformClass(source);
    const sourceType = determineType(source);
    switch (sourceType) {
        case 'string':
            const type = source;
            if (storage.names.has(type)) {
                throw new Error(`Forbidden to use reserved word "${type}" as type name.`);
            }
            if (!(storage.types.has(type) || storage.models.has(type))) {
                throw new Error(`Unknown model "${type}".`);
            }
            return new ValueDescription(type, options);
        case 'array':
            return new ValueDescription('array', {items: source[0]});
        case 'object':
            return new ValueDescription('object', {schema: source});
        case 'function':
            return new ValueDescription('class', {class: source});
        default:
            throw new Error('Invalid schema.');
    }
}

class ValueDescription {
    constructor(type, options = {}) {
        this.type = type;
        this.required = (options.required !== false);
        this.matchOnce = (options.matchOnce === true);
        this.allowNull = (options.allowNull === true);
        this.noDefault = (options.default === undefined);

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

        let validator = () => true;

        if (options.validator instanceof RegExp) {
            const typesValidatedByRegExp = new Set(['string', 'number']);
            if (typesValidatedByRegExp.has(this.type)) {
                validator = value => options.validator.test(value);
            } else {
                throw new Error('RegExp-validator can only be used with types "string" and "number".');
            }
        } else if (options.validator instanceof Function) {
            validator = value => (options.validator(value) === true);
        }

        this.isValid = value => {
            try {
                return validator(value);
            } catch (e) {
                return false;
            }
        };

        switch (this.type) {
            case 'array':
                if (options.items) {
                    this.items = describeValue(options.items);
                } else {
                    this.items = null;
                }
                break;
            case 'object':
                const schema = options.schema;
                if (schema) {
                    this.schema = {};
                    for (let key in schema) {
                        const patternKeyRegExp = new RegExp(/^\/\^.*\$\/$/);
                        if (patternKeyRegExp.test(key)) {
                            try {
                                new RegExp(key.slice(1, -1));
                            } catch (e) {
                                throw new Error(`RegExpKey "${key}" is invalid.`);
                            }
                        }
                        this.schema[key] = describeValue(schema[key]);
                    }
                } else {
                    this.schema = null;
                }
                Object.freeze(this.schema);
                break;
            case 'class':
                this.class = (options.class || (class {
                }));
                Object.freeze(this.class);
        }
        Object.freeze(this);
    }
}

module.exports = {buildDescription, describeValue, ValueDescription};
