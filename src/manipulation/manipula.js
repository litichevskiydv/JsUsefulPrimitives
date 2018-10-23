const Manipula = class Manipula {
    static from(iterable) {
        return new FromIterator(iterable);
    }

    toArray() {
        return Array.from(this);
    }

    select(selector) {
        return new SelectIterator(this, selector);
    }
};
module.exports = Manipula;

class FromIterator extends Manipula {
    constructor(iterable) {
        super();
        this._iterable = iterable;
    }

    *[Symbol.iterator]() {
        for (let item of this._iterable) yield item;
    }
}

class SelectIterator extends Manipula {
    constructor(iterable, selector) {
        super();
        this._iterable = iterable;
        this._selector = selector;
    }

    *[Symbol.iterator]() {
        let i = 0;
        for (let item of this._iterable) yield this._selector(item, i++);
    }
}
