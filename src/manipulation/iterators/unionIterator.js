const Manipula = require("../manipula");
const HashSet = require("../../collections/hashSet");
const DefaultComparer = require("../../comparison/defaultEqualityComparer");

class UnionIterator extends Manipula {
  constructor(first, second, comparer) {
    super();
    this._first = first;
    this._second = second;
    this._comparer = comparer || DefaultComparer;
  }

  *_iterate(set, source) {
    for (const element of source)
      if (set.has(element) === false) {
        set.add(element);
        yield element;
      }
  }

  *[Symbol.iterator]() {
    const set = new HashSet(this._comparer);
    yield* this._iterate(set, this._first);
    yield* this._iterate(set, this._second);
  }
}

Manipula.prototype.union = function(second, comparer) {
  return new UnionIterator(this, second, comparer);
};
