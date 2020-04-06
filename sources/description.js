const {getType} = require('./type');

function buildDescription(schema, sever) {
    const description = createValueDescription(schema, sever);
    const topLevelTypes = new Set(['object', 'array']);
    if (!topLevelTypes.has(description.type)) {
        throw new Error('On top level schema must be an object or an array.');
    }
    if (description.allowNull) {
        throw new Error('On top level object or array cannot be a null.');
    }
    return description;
}

function describeValue(type, options, sever) {
    if (typeof (type) !== 'string') {
        throw new Error('The type must be a string.');
    }
    if (sever.reserved.has(type)) {
        throw new Error(`Forbidden to use reserved word "${type}" as type name.`);
    }
    if (!(sever.types.has(type) || sever.models.has(type))) {
        throw new Error(`Unknown model "${type}".`);
    }
    return new ValueDescription(type, options, sever);
}

function createValueDescription(value, sever) {
    if (value instanceof ValueDescription) {
        return value;
    }
    switch (getType(value)) {
        case 'string':
            return describeValue(value, {}, sever);
        case 'array':
            return describeValue('array', {items: value[0]}, sever);
        case 'object':
            return describeValue('object', {schema: value}, sever);
        default:
            throw new Error('Invalid schema.');
    }
}

class ValueDescription {
    constructor(type = "", options = {}, sever) {
        this.type = type;
        this.required = (options.required !== false);
        this.matchOnce = (options.matchOnce === true);
        this.allowNull = (options.allowNull === true);
        this.noDefault = (options.default === undefined);

        if (options.default instanceof Function) {
            this.getDefault = () => options.default();
        } else {
            this.getDefault = () => options.default;
        }

        if (options.validator instanceof RegExp) {
            if ((this.type === 'string') || (this.type === 'number')) {
                this.validator = value => options.validator.test(value);
            } else {
                throw new Error('RegExp-validator can only be used with types "string" and "number".');
            }
        } else if (options.validator instanceof Function) {
            this.validator = value => (options.validator(value) === true);
        } else {
            this.validator = () => true;
        }

        this.isValid = value => {
            try {
                return this.validator(value);
            } catch (e) {
                console.log(e);
                return false;
            }
        };

        switch (this.type) {
            case 'array':
                if (options.items) {
                    this.items = createValueDescription(options.items, sever);
                } else {
                    this.items = null;
                }
                break;
            case 'object':
                if (options.schema) {
                    const patternKeyRegExp = /^\/\^.*\$\/$/;
                    for (let key in options.schema) {
                        if (patternKeyRegExp.test(key)) {
                            try {
                                new RegExp(key.slice(1, -1));
                            } catch (e) {
                                throw new Error(`RegExpKey "${key}" is invalid.`);
                            }
                        }
                        options.schema[key] = createValueDescription(options.schema[key], sever);
                    }
                    this.schema = options.schema;
                } else {
                    this.schema = null;
                }
        }
    }
}

module.exports = {buildDescription, describeValue};
