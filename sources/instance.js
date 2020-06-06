import {determineType} from './helpers.js';

function checkValue(source, description) {
    const sourceType = determineType(source);
    if (sourceType === description.type) {
        const items = description.items;
        if ((sourceType === 'array') && items) {
            const array = source;
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
        if ((sourceType === 'object') && schema) {
            const object = source;
            const objectKeys = new Set(Object.keys(object).filter(key => (object[key] !== undefined)));
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
        if (sourceType === 'undefined') {
            return false;
        }
        if (description.type === 'any') {
            return true;
        }
        if (sourceType === 'null') {
            return description.allowNull;
        }
        if ((description.type === 'class') && (source instanceof description.class)) {
            return true;
        }
        if ((description.type === 'model') && description.model.check(source)) {
            return true;
        }
        if (description.type === 'mix') {
            const choices = [...description.choices.values()];
            const checkResult = choices.some(valueDescription => checkValue(source, valueDescription));
            if ((description.strategy !== 'not') === checkResult) {
                return true;
            }
        }
        return false;
    }
}

function buildValue(source, description) {
    return source;
}

export {checkValue, buildValue};
