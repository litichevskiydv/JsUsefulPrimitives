const HashSet = require("../collections/hashSet");

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

    where(predicate) {
        return new WhereIterator(this, predicate);
    }

    concat(second) {
        return new ConcatIterator(this, second);
    }

    union(second, comparer) {
        return new UnionIterator(this, second, comparer);
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

class WhereIterator extends Manipula {
    constructor(iterable, predicate) {
        super();
        this._iterable = iterable;
        this._predicate = predicate;
    }

    *[Symbol.iterator]() {
        let i = 0;
        for (let item of this._iterable) if (this._predicate(item, i++)) yield item;
    }
}

class ConcatIterator extends Manipula {
    constructor(first, second) {
        super();
        this._first = first;
        this._second = second;
    }

    *[Symbol.iterator]() {
        yield* this._first;
        yield* this._second;
    }
}

class UnionIterator extends Manipula {
    constructor(first, second, comparer) {
        super();
        this._first = first;
        this._second = second;
        this._comparer = comparer;
    }

    *_iterate(set, source) {
        for (let item of source)
            if (set.has(item) === false) {
                set.add(item);
                yield item;
            }
    }

    *[Symbol.iterator]() {
        let set = !this._comparer ? new Set() : new HashSet(this._comparer);
        yield* this._iterate(set, this._first);
        yield* this._iterate(set, this._second);
    }
}
