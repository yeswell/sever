declare class ValueDescription {}

declare class Model {
    constructor (object: object);

    static create(object: object): Model;
    static check(object: object): boolean;
    static getName(): string;
    static getDescription(): ValueDescription;
    static toObject(instance: Model): object;
    static toJSON(instance: Model, options: object): string;
}

declare class Sever {
    constructor (name?: string);

    schema(...objects: object[]): Map<string|RegExp, ValueDescription>;
    mix(...types: object[]): Set<ValueDescription>;
    value(type: object, options: object): ValueDescription;
    model: {
        (name: string, schema: object): (typeof Model);
        [model: string]: (typeof Model);
    };
    toObject(instance: Model): object;
    toJSON(instance: Model, options: object): string;

    static schema(...objects: object[]): Map<string|RegExp, ValueDescription>;
    static mix(...types: object[]): Set<ValueDescription>;
    static value(type: object, options: object): ValueDescription;
    static model: {
        (name: string, schema: object): (typeof Model);
        [model: string]: (typeof Model);
    };
    static toObject(instance: Model): object;
    static toJSON(instance: Model, options: object): string;
}

export = Sever;
