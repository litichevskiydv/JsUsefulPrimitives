const HashSet = require("../collections/hashSet");
const HashMap = require("../collections/hashMap");

const Manipula = class Manipula {
  static get _lengthPropertyName() {
    return "length";
  }

  static from(iterable) {
    return new FromIterator(iterable);
  }

  count(predicate) {
    if (!predicate && Manipula._lengthPropertyName in this) return this[Manipula._lengthPropertyName];

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

  any(predicate) {
    for (let element of this) if (!predicate || predicate(element)) return true;
    return false;
  }

  all(predicate) {
    for (let element of this) if (!predicate(element)) return false;
    return true;
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

  toArray() {
    return Array.from(this);
  }

  toSet(comparer) {
    let set = !comparer ? new Set() : new HashSet(comparer);
    for (let element of this) set.add(element);

    return set;
  }

  toMap(options) {
    let map = !options.comparer ? new Map() : new HashMap(options.comparer);
    for (let element of this) map.set(options.keySelector(element), !options.elementSelector ? element : options.elementSelector(element));

    return map;
  }
};
module.exports = Manipula;

class FromIterator extends Manipula {
  constructor(iterable) {
    super();
    this._iterable = iterable;

    if (Manipula._lengthPropertyName in iterable)
      Object.defineProperty(this, Manipula._lengthPropertyName, {
        get: () => this._iterable[Manipula._lengthPropertyName]
      });
  }

  *[Symbol.iterator]() {
    for (let element of this._iterable) yield element;
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
