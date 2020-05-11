function validate(changed) {
    const storage = this;
    if (storage.description.hasValidator) {
        if (!storage.description.isValid(storage.state)) {
            return changed.undo();
        }
    }
    if (storage.parent !== null) {
        return storage.parent.validate(changed);
    }
    return changed.save();
}

function undo() {
    const storage = this;
    storage.state = storage.prevState;
    storage.prevState = null;
    return false;
}

function save() {
    const storage = this;
    storage.prevState = null;
    return true;
}

function buildStorage(state, description, parent) {
    const storage = {
        prevState: null,
        state,
        description,
        parent,
        validate,
        undo,
        save
    };
    return storage;
}

function getObjectHandler() {

}

function setObjectHandler() {

}

const handlerObjectProxy = {
    get: getObjectHandler,
    set: setObjectHandler
};

class ObjectProxy extends Proxy {
    constructor(object, description, parent) {
        const storage = buildStorage(object, description, parent);
        super(storage, handlerObjectProxy);
    }
}

function getArrayHandler() {

}

function setArrayHandler() {

}

const handlerArrayProxy = {
    get: getArrayHandler,
    set: setArrayHandler
};

class ArrayProxy extends Proxy {
    constructor(array, description, parent) {
        const storage = buildStorage(array, description, parent);
        super(storage, handlerArrayProxy);
    }
}

module.exports = {ObjectProxy, ArrayProxy};
