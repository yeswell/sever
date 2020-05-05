const Sever = require('../../main');

const name = 'User';

const schema = {
    name: 'string',
    age: Number,
    children: [{
        name: 'string',
        age: Sever.value('number', {validator: n => ((n > 0) && (n < 99))})
    }],
    '18+': Sever.value('boolean', {required: false}),
    getName: Function
};

const model = Sever.model(name, schema);

module.exports = model;
