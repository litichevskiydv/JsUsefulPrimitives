const HashSet = require("../collections/hashSet");
let Manipula = require("./manipula");

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

Manipula.prototype.distinct = function(comparer) {
  return new DistinctIterator(this, comparer);
};
