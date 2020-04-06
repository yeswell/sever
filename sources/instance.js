const {getType} = require('./type');

function buildCheck(description, models) {
    const checkValue = (value, description) => {
        const type = getType(value);
        if (type === description.type) {
            if ((type === 'array') && description.items) {
                if (!value.every(item => checkValue(item, description.items))) {
                    return false;
                }
            }
            if ((type === 'object') && description.schema) {
                const objectKeys = new Set(Object.keys(value));
                const patternKeyRegExp = /^\/\^.*\$\/$/;
                for (let key in description.schema) {
                    if (patternKeyRegExp.test(key)) {
                        const keyRegExp = new RegExp(key.slice(1, -1));
                        const matchedKeys = new Set();
                        for (const objectKey of objectKeys) {
                            if (keyRegExp.test(objectKey)) {
                                matchedKeys.add(objectKey);
                                if (description.matchOnce) {
                                    break;
                                }
                            }
                        }
                        if (matchedKeys.size > 0) {
                            for (const objectKey of matchedKeys) {
                                if (checkValue(value[objectKey], description.schema[key])) {
                                    objectKeys.delete(objectKey);
                                } else {
                                    return false;
                                }
                            }
                        } else {
                            if (description.schema[key].required && description.schema[key].noDefault) {
                                return false;
                            }
                        }
                    } else {
                        if (objectKeys.has(key)) {
                            if (!checkValue(value[key], description.schema[key])) {
                                return false;
                            }
                        } else {
                            if (description.schema[key].required && description.schema[key].noDefault) {
                                return false;
                            }
                        }
                        objectKeys.delete(key);
                    }
                }
                if (objectKeys.size > 0) {
                    return false;
                }
            }
            return description.isValid(value);
        } else {
            if (description.type === 'any') {
                return description.isValid(value);
            }
            if (type === 'null') {
                return description.allowNull;
            }
            if (models.has(description.type)) {
                const model = models.get(description.type);
                if ((value instanceof model) || model.check(value)) {
                    return description.isValid(value);
                }
            }
            return false;
        }
    };
    const check = object => checkValue(object, description);
    return check;
}

function buildInstance(object, check) {
    if (!check(object)) {
        throw new Error('Invalid object.');
    }
    return object;
}

function buildCreate(check) {
    const create = (object = {}) => {
        const instance = buildInstance(object, check);
        return instance;
    };
    return create;
}

function getKeyDescription(key, schema) {
    const patternKeyRegExp = /^\/\^.*\$\/$/;
    for (const schemaKey in schema) {
        if (patternKeyRegExp.test(schemaKey)) {
            const keyRegExp = new RegExp(schemaKey.slice(1, -1));
            if (keyRegExp.test(key)) {
                return schema[schemaKey];
            }
        } else if (key === schemaKey) {
            return schema[schemaKey];
        }
    }
}

module.exports = {buildCheck, buildCreate};
