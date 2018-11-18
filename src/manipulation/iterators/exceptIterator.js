const HashSet = require("../../collections/hashSet");
let Manipula = require("../manipula");

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

Manipula.prototype.except = function(second, comparer) {
  return new ExceptIterator(this, second, comparer);
};
