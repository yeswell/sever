import {buildValue} from './instance.js';

function getKeyDescription(key, schema) {
    for (const schemaKey of schema.keys()) {
        if ((schemaKey === key) || ((schemaKey instanceof RegExp) && schemaKey.test(key))) {
            return schema.get(schemaKey);
        }
    }
}

function validate() {
    const storage = this;
    if (storage.description.hasValidator) {
        if (!storage.description.isValid(storage.state)) {
            return false;
        }
    }
    if (storage.parent !== null) {
        return storage.parent.validate();
    }
    return true;
}

function update(key, value) {
    const storage = this;

    storage.prevState = storage.state;
    storage.state = {...storage.prevState, [key]: value};

    const result = storage.validate();
    if (!result) {
        storage.state = storage.prevState;
    }
    storage.prevState = null;

    return result;
}

function buildStorage(state, description, parent) {
    const storage = {
        prevState: null,
        state,
        description,
        parent,
        validate,
        update
    };
    return storage;
}

function getObjectHandler(storage, key) {
    return storage.state[key];
}

function setObjectHandler(storage, key, source) {
    const description = getKeyDescription(key, storage.description.schema);
    if (description === undefined) {
        return false;
    }

    const value = buildValue(source, description);
    if (value === undefined) {
        return false;
    }

    const result = storage.update(key, value);
    return result;
}

const handlerObjectProxy = {
    // apply() {},
    // construct() {},
    // defineProperty() {},
    // deleteProperty() {},
    get: getObjectHandler,
    // getOwnPropertyDescriptor() {},
    // getPrototypeOf() {},
    // has() {},
    // isExtensible() {},
    // ownKeys() {},
    // preventExtensions() {},
    set: setObjectHandler,
    // setPrototypeOf() {}
};

class ObjectProxy {
    constructor(object, description, parent) {
        const storage = buildStorage(object, description, parent);
        const proxy = new Proxy(storage, handlerObjectProxy);
        Reflect.setPrototypeOf(proxy, ObjectProxy.prototype);
        return proxy;
    }
}

function getArrayHandler(storage, key) {

}

function setArrayHandler(storage, key, source) {

}

const handlerArrayProxy = {
    // apply() {},
    // construct() {},
    // defineProperty() {},
    // deleteProperty() {},
    get: getArrayHandler,
    // getOwnPropertyDescriptor() {},
    // getPrototypeOf() {},
    // has() {},
    // isExtensible() {},
    // ownKeys() {},
    // preventExtensions() {},
    set: setArrayHandler,
    // setPrototypeOf() {}
};

class ArrayProxy {
    constructor(array, description, parent) {
        const storage = buildStorage(array, description, parent);
        const proxy = new Proxy(storage, handlerArrayProxy);
        Reflect.setPrototypeOf(proxy, ArrayProxy.prototype);
        return proxy;
    }
}

export {ObjectProxy, ArrayProxy};
