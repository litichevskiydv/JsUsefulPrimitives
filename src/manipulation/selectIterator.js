let Manipula = require("./manipula");

class SelectIterator extends Manipula {
  constructor(iterable, selector) {
    super();
    this._iterable = iterable;
    this._selector = selector;

    if (Manipula._lengthPropertyName in iterable)
      Object.defineProperty(this, Manipula._lengthPropertyName, {
        get: () => this._iterable[Manipula._lengthPropertyName]
      });
  }

  *[Symbol.iterator]() {
    let i = 0;
    for (let element of this._iterable) yield this._selector(element, i++);
  }
}

Manipula.prototype.select = function(selector) {
  return new SelectIterator(this, selector);
};
