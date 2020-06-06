const {version} = require('../../package');

const Sever = require(`../../builds/${version}/cjs.sever`);

const name = 'Child';

const schema = {
    requiredKeyWithDefaultValue: Sever.value(String, {default: 'Hello, world!'}),
    firstborn: Boolean,
    wildArray: ['any'],
    parents: [
        Sever.value('User', {allowNull: true})
    ],
    '/^RegExp.+$/': String
};

const model = Sever.model(name, schema);

module.exports = model;
