const {determineType} = require('./helpers');

function checkValue(value, description) {
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
                            return choices.some(valueDescription => checkValue(item, valueDescription));
                        });
                        break;
                    case 'all':
                        const valueDescriptions = new Set(choices);
                        checkResult = array.every(item => {
                            return choices.some(valueDescription => {
                                const itemCheckResult = checkValue(item, valueDescription);
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
                            return array.every(item => checkValue(item, valueDescription));
                        });
                        break;
                    case 'not':
                        checkResult = array.every(item => {
                            return !choices.some(valueDescription => checkValue(item, valueDescription));
                        });
                        break;
                }
            } else {
                checkResult = array.every(item => checkValue(item, items));
            }
            return checkResult;
        }
        const schema = description.schema;
        if ((valueType === 'object') && schema) {
            const object = value;
            const objectKeys = new Set(Object.keys(object));
            for (const schemaKey of schema.keys()) {
                const keyDescription = schema.get(schemaKey);
                const matchedKeys = new Set();
                if (schemaKey instanceof RegExp) {
                    for (const objectKey of objectKeys) {
                        if (schemaKey.test(objectKey)) {
                            matchedKeys.add(objectKey);
                            if (description.matchOnce) {
                                break;
                            }
                        }
                    }
                } else if (objectKeys.has(schemaKey)) {
                    matchedKeys.add(schemaKey);
                }
                if (matchedKeys.size > 0) {
                    for (const matchedKey of matchedKeys) {
                        if (!checkValue(object[matchedKey], keyDescription)) {
                            return false;
                        }
                        objectKeys.delete(matchedKey);
                    }
                } else if (keyDescription.required && !keyDescription.hasDefault) {
                    return false;
                }
            }
            const checkResult = (objectKeys.size === 0);
            return checkResult;
        }
        return true;
    } else {
        if (valueType === 'undefined') {
            return false;
        }
        if (description.type === 'any') {
            return true;
        }
        if (valueType === 'null') {
            return description.allowNull;
        }
        if ((description.type === 'class') && (value instanceof description.class)) {
            return true;
        }
        if ((description.type === 'model') && description.model.check(value)) {
            return true;
        }
        if (description.type === 'mix') {
            const choices = [...description.choices.values()];
            const checkResult = choices.some(valueDescription => checkValue(value, valueDescription));
            if ((description.strategy !== 'not') === checkResult) {
                return true;
            }
        }
        return false;
    }
}

function buildCheck(description) {
    const check = object => {
        const checkResult = checkValue(object, description);
        return checkResult;
    };
    return check;
}

function buildValue(source, description) {

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

module.exports = {buildCheck, buildValue, buildCreate};
