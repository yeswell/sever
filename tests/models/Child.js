const Sever = require('../../main');

const name = 'Child';

const schema = {
    requiredKeyWithDefaultValue: Sever.value('string', {default: "Hello, world!"}),
    firstborn: 'boolean',
    wildArray: ['any'],
    parents: [
        Sever.value('User', {allowNull: true})
    ],
    '/^RegExp.+$/': 'string'
};

const model = Sever.model(name, schema);

module.exports = model;
