require("./fromIterator");
require("./selectIterator");

const HashMap = require("../../collections/hashMap");
let Manipula = require("../manipula");

class GroupByIterator extends Manipula {
  constructor(source, keySelector, elementSelector, comparer) {
    super();
    this._source = source;
    this._keySelector = keySelector;
    this._elementSelector = elementSelector;
    this._comparer = comparer;
  }

  *[Symbol.iterator]() {
    let map = !this._comparer ? new Map() : new HashMap(this._comparer);
    for (const element of this._source) {
      const elementKey = this._keySelector(element);
      let bucket = map.get(elementKey);
      if (!bucket) {
        bucket = [];
        map.set(elementKey, bucket);
      }

      bucket.push(element);
    }

    for (const pair of map) {
      let values = Manipula.from(pair[1]);
      if (this._elementSelector) values = values.select(this._elementSelector);
      Object.defineProperty(values, "key", { value: pair[0] });

      yield values;
    }
  }
}

Manipula.prototype.groupBy = function(keySelector, options) {
  const opt = options || {};
  return new GroupByIterator(this, keySelector, opt.elementSelector, opt.comparer);
};
