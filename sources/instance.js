const {determineType} = require('./helpers');

const storage = require('./storage');

function checkValue(value, description, options = {validationRequired: true}) {
    const validationResult = () => {
        if (options.validationRequired) {
            return description.isValid(value);
        }
        return true;
    };
    const valueType = determineType(value);
    if (valueType === description.type) {
        const items = description.items;
        if ((valueType === 'array') && items) {
            const array = value;
            let checkResult = false;
            if (items.type === 'mix') {
                const choices = [...description.choices.values()];
                switch (items.strategy) {
                    case 'any':
                        checkResult = array.every(item => {
                            return choices.some(valueDescription => checkValue(item, valueDescription, options));
                        });
                        break;
                    case 'all':
                        const valueDescriptions = new Set(choices);
                        checkResult = array.every(item => {
                            return choices.some(valueDescription => {
                                const itemCheckResult = checkValue(item, valueDescription, options);
                                if (itemCheckResult) {
                                    valueDescriptions.delete(valueDescription);
                                }
                                return itemCheckResult;
                            });
                        });
                        checkResult &= (valueDescriptions.size === 0);
                        break;
                    case 'one':
                        checkResult = choices.some(valueDescription => {
                            return array.every(item => checkValue(item, valueDescription, options));
                        });
                        break;
                    case 'not':
                        checkResult = array.every(item => {
                            return !choices.some(valueDescription => checkValue(item, valueDescription, options));
                        });
                        break;
                }
            } else {
                checkResult = array.every(item => checkValue(item, items, options));
            }
            if (!checkResult) {
                return false;
            }
        }
        const schema = description.schema;
        if ((valueType === 'object') && schema) {
            const objectKeys = new Set(Object.keys(value));
            for (const key of schema.keys()) {
                const keyDescription = schema.get(key);
                const patternKeyRegExp = new RegExp(/^\/\^.*\$\/$/);
                if (patternKeyRegExp.test(key)) {
                    const matchedKeys = new Set();
                    for (const objectKey of objectKeys) {
                        const keyRegExp = new RegExp(key.slice(1, -1));
                        if (keyRegExp.test(objectKey)) {
                            matchedKeys.add(objectKey);
                            if (description.matchOnce) {
                                break;
                            }
                        }
                    }
                    if (matchedKeys.size > 0) {
                        for (const objectKey of matchedKeys) {
                            if (checkValue(value[objectKey], keyDescription, options)) {
                                objectKeys.delete(objectKey);
                            } else {
                                return false;
                            }
                        }
                    } else {
                        if (keyDescription.required && keyDescription.noDefault) {
                            return false;
                        }
                    }
                } else {
                    if (objectKeys.has(key)) {
                        if (!checkValue(value[key], keyDescription, options)) {
                            return false;
                        }
                    } else {
                        if (keyDescription.required && keyDescription.noDefault) {
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
        return validationResult();
    } else {
        if (description.type === 'any') {
            return validationResult();
        }
        if (valueType === 'null') {
            return description.allowNull;
        }
        if ((description.type === 'class') && (value instanceof description.class)) {
            return validationResult();
        }
        if ((description.type === 'model') && description.model.check(value)) {
            return validationResult();
        }
        if (description.type === 'mix') {
            const choices = [...description.choices.values()];
            const checkResult = choices.some(valueDescription => checkValue(value, valueDescription, options));
            if ((description.strategy !== 'not') === checkResult) {
                return validationResult();
            }
        }
        return false;
    }
}

function buildCheck(description) {
    const check = object => {
        const checkResult = checkValue(object, description, {validationRequired: false});
        return checkResult;
    };
    return check;
}

function buildInstance(object, check) {
    if (!check(object)) {
        throw new Error('Invalid object.');
    }
    return object;
}

function buildCreate(check) {
    const create = object => {
        const instance = buildInstance(object, check);
        return instance;
    };
    return create;
}

function getKeyDescription(key, schema) {
    for (const schemaKey of schema.keys()) {
        const patternKeyRegExp = new RegExp(/^\/\^.*\$\/$/);
        if (patternKeyRegExp.test(schemaKey)) {
            const keyRegExp = new RegExp(schemaKey.slice(1, -1));
            if (keyRegExp.test(key)) {
                return schema.get(schemaKey);
            }
        } else if (key === schemaKey) {
            return schema.get(schemaKey);
        }
    }
}

module.exports = {buildCheck, buildCreate};
