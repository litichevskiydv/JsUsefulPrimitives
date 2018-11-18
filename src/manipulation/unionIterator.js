const HashSet = require("../collections/hashSet");
let Manipula = require("./manipula");

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

Manipula.prototype.union = function(second, comparer) {
  return new UnionIterator(this, second, comparer);
};
