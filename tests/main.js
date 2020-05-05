const Sever = require('../main');

const User = require('./models/User');
const Child = require('./models/Child');

test();

function test() {
    let user1 = new Sever.model.User({
        name: 'Jon Doe',
        age: 23,
        children: [{
            name: 'Ellen',
            age: 1
        }],
        getName() {console.log(this.name)}
    });
    console.log(user1);
    user1.getName();
    let user2 = User.create({
        name: 'Marian',
        age: 20,
        children: [{
            name: 'Ellen',
            age: 1
        }],
        '18+': false,
        getName() {console.log(this.name)}
    });
    console.log(user2);
    user2.getName();
    let child = new Child({
        firstborn: false,
        wildArray: [1, 4, 6, {a: 7}, null, null, [[1]]],
        parents: [user1, user2],
        RegExpKeysWorks: 'Yeahhh!'
    });
    console.log(child);
    child.firstborn = true;
    child.parents[0].age = 24;
    console.log(child);
}

