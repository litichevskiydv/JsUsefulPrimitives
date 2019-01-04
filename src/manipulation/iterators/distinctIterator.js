const Manipula = require("../manipula");
const HashSet = require("../../collections/hashSet");
const DefaultComparer = require("../../comparison/defaultEqualityComparer");

class DistinctIterator extends Manipula {
  constructor(source, comparer) {
    super();
    this._source = source;
    this._comparer = comparer || DefaultComparer;
  }

  *[Symbol.iterator]() {
    const set = new HashSet(this._comparer);

    for (const element of this._source)
      if (set.has(element) === false) {
        set.add(element);
        yield element;
      }
  }
}

Manipula.prototype.distinct = function(comparer) {
  return new DistinctIterator(this, comparer);
};
