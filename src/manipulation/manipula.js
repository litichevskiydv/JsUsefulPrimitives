const HashSet = require("../collections/hashSet");
const lengthPropertyName = "length";

const Manipula = class Manipula {
  static from(iterable) {
    return new FromIterator(iterable);
  }

  count(predicate) {
    if (!predicate && lengthPropertyName in this) return this[lengthPropertyName];

    let count = 0;
    for (let element of this) if (!predicate || predicate(element)) count++;
    return count;
  }

  _tryGetFirst(predicate) {
    for (let element of this)
      if (!predicate || predicate(element))
        return {
          found: true,
          element: element
        };

    return { found: false, element: null };
  }

  first(predicate) {
    let searchResult = this._tryGetFirst(predicate);
    if (searchResult.found === true) return searchResult.element;

    throw new Error("No matching element was found");
  }

  firstOrDefault(predicate) {
    return this._tryGetFirst(predicate).element;
  }

  _tryGetSingle(predicate) {
    let iterator = this[Symbol.iterator]();
    for (let currentState = iterator.next(); currentState.done === false; currentState = iterator.next()) {
      const result = currentState.value;
      if (!predicate || predicate(result)) {
        for (currentState = iterator.next(); currentState.done === false; currentState = iterator.next())
          if (!predicate || predicate(currentState.value)) return { foundMoreThanOnce: true };
        return { foundOnce: true, element: result };
      }
    }

    return { foundOnce: false, element: null };
  }

  single(predicate) {
    let searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    if (searchResult.foundOnce === true) return searchResult.element;
    throw new Error("No matching element was found");
  }

  singleOrDefault(predicate) {
    let searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    return searchResult.element;
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

  except(second, comparer) {
    return new ExceptIterator(this, second, comparer);
  }

  distinct(comparer) {
    return new DistinctIterator(this, comparer);
  }
};
module.exports = Manipula;

class FromIterator extends Manipula {
  constructor(iterable) {
    super();
    this._iterable = iterable;

    if (lengthPropertyName in iterable)
      Object.defineProperty(this, lengthPropertyName, {
        get: () => this._iterable[lengthPropertyName]
      });
  }

  *[Symbol.iterator]() {
    for (let element of this._iterable) yield element;
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
    for (let element of this._iterable) yield this._selector(element, i++);
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
    for (let element of this._iterable) if (this._predicate(element, i++)) yield element;
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
    for (let element of source)
      if (set.has(element) === false) {
        set.add(element);
        yield element;
      }
  }

  *[Symbol.iterator]() {
    let set = !this._comparer ? new Set() : new HashSet(this._comparer);
    yield* this._iterate(set, this._first);
    yield* this._iterate(set, this._second);
  }
}

class ExceptIterator extends Manipula {
  constructor(first, second, comparer) {
    super();
    this._first = first;
    this._second = second;
    this._comparer = comparer;
  }

  *[Symbol.iterator]() {
    let set = !this._comparer ? new Set() : new HashSet(this._comparer);
    for (let element of this._second) set.add(element);

    for (let element of this._first)
      if (set.has(element) === false) {
        set.add(element);
        yield element;
      }
  }
}

class DistinctIterator extends Manipula {
  constructor(source, comparer) {
    super();
    this._source = source;
    this._comparer = comparer;
  }

  *[Symbol.iterator]() {
    let set = !this._comparer ? new Set() : new HashSet(this._comparer);

    for (let element of this._source)
      if (set.has(element) === false) {
        set.add(element);
        yield element;
      }
  }
}
