const HashSet = require("../collections/hashSet");
const HashMap = require("../collections/hashMap");

module.exports = class Manipula {
  static get _lengthPropertyName() {
    return "length";
  }

  count(predicate) {
    if (!predicate && Manipula._lengthPropertyName in this) return this[Manipula._lengthPropertyName];

    let count = 0;
    for (let element of this) if (!predicate || predicate(element)) count++;
    return count;
  }

  _tryGetFirst(predicate) {
    for (let element of this)
      if (!predicate || predicate(element))
        return {
          found: true,
          element: element
        };

    return { found: false, element: null };
  }

  first(predicate) {
    let searchResult = this._tryGetFirst(predicate);
    if (searchResult.found === true) return searchResult.element;

    throw new Error("No matching element was found");
  }

  firstOrDefault(predicate) {
    return this._tryGetFirst(predicate).element;
  }

  _tryGetSingle(predicate) {
    let iterator = this[Symbol.iterator]();
    for (let currentState = iterator.next(); currentState.done === false; currentState = iterator.next()) {
      const result = currentState.value;
      if (!predicate || predicate(result)) {
        for (currentState = iterator.next(); currentState.done === false; currentState = iterator.next())
          if (!predicate || predicate(currentState.value)) return { foundMoreThanOnce: true };
        return { foundOnce: true, element: result };
      }
    }

    return { foundOnce: false, element: null };
  }

  single(predicate) {
    let searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    if (searchResult.foundOnce === true) return searchResult.element;
    throw new Error("No matching element was found");
  }

  singleOrDefault(predicate) {
    let searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    return searchResult.element;
  }

  any(predicate) {
    for (let element of this) if (!predicate || predicate(element)) return true;
    return false;
  }

  all(predicate) {
    for (let element of this) if (!predicate(element)) return false;
    return true;
  }

  toArray() {
    return Array.from(this);
  }

  toSet(comparer) {
    let set = !comparer ? new Set() : new HashSet(comparer);
    for (let element of this) set.add(element);

    return set;
  }

  toMap(options) {
    let map = !options.comparer ? new Map() : new HashMap(options.comparer);
    for (let element of this) map.set(options.keySelector(element), !options.elementSelector ? element : options.elementSelector(element));

    return map;
  }
};
