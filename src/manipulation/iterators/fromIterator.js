const Manipula = require("../manipula");

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
    for (const element of this._iterable) yield element;
  }
}

Manipula.from = function(iterable) {
  return new FromIterator(iterable);
};
