let Manipula = require("./manipula");

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

Manipula.prototype.where = function(predicate) {
  return new WhereIterator(this, predicate);
};
