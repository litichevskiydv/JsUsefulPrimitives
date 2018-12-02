const HashSet = require("../../collections/hashSet");
let Manipula = require("../manipula");

class IntersectIterator extends Manipula {
  constructor(first, second, comparer) {
    super();
    this._first = first;
    this._second = second;
    this._comparer = comparer;
  }

  *[Symbol.iterator]() {
    let set = !this._comparer ? new Set() : new HashSet(this._comparer);
    for (let element of this._second) set.add(element);

    for (let element of this._first) if (set.delete(element) === true) yield element;
  }
}

Manipula.prototype.intersect = function(second, comparer) {
  return new IntersectIterator(this, second, comparer);
};
