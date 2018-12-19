const HashSet = require("../collections/hashSet");
const HashMap = require("../collections/hashMap");

module.exports = class Manipula {
  static get _lengthPropertyName() {
    return "length";
  }

  count(predicate) {
    if (!predicate && Manipula._lengthPropertyName in this) return this[Manipula._lengthPropertyName];

    let count = 0;
    for (const element of this) if (!predicate || predicate(element)) count++;
    return count;
  }

  _tryGetFirst(predicate) {
    for (const element of this)
      if (!predicate || predicate(element))
        return {
          found: true,
          element: element
        };

    return { found: false, element: null };
  }

  first(predicate) {
    const searchResult = this._tryGetFirst(predicate);
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
    const searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    if (searchResult.foundOnce === true) return searchResult.element;
    throw new Error("No matching element was found");
  }

  singleOrDefault(predicate) {
    const searchResult = this._tryGetSingle(predicate);

    if (searchResult.foundMoreThanOnce === true) throw new Error("More than one element was found");
    return searchResult.element;
  }

  any(predicate) {
    for (const element of this) if (!predicate || predicate(element)) return true;
    return false;
  }

  all(predicate) {
    for (const element of this) if (!predicate(element)) return false;
    return true;
  }

  contains(value, comparer) {
    for (const element of this) if (element === value || (comparer && comparer.equals(element, value))) return true;
    return false;
  }

  toArray() {
    return Array.from(this);
  }

  toSet(comparer) {
    let set = !comparer ? new Set() : new HashSet(comparer);
    for (let element of this) set.add(element);

    return set;
  }

  toMap(keySelector, options) {
    const opt = options || {};
    let map = !opt.comparer ? new Map() : new HashMap(opt.comparer);
    for (const element of this) map.set(keySelector(element), !opt.elementSelector ? element : opt.elementSelector(element));

    return map;
  }

  _tryGetElementByIndex(index) {
    if (index < 0) return { found: false, element: null };

    let i = 0;
    for (const element of this) if (i++ === index) return { found: true, element: element };

    return { found: false, element: null };
  }

  elementAt(index) {
    const searchResult = this._tryGetElementByIndex(index);
    if (searchResult.found === false) throw new Error(`Index ${index} lies out of range`);

    return searchResult.element;
  }

  elementAtOrDefault(index) {
    return this._tryGetElementByIndex(index).element;
  }

  _aggregate(iterator, accumulatorInitialValue, aggregateFunction) {
    let accumulator = accumulatorInitialValue;
    for (let currentState = iterator.next(), i = 0; currentState.done === false; currentState = iterator.next(), i++)
      accumulator = aggregateFunction(accumulator, currentState.value, i);

    return accumulator;
  }

  aggregate(accumulatorInitialValue, aggregateFunction) {
    return this._aggregate(this[Symbol.iterator](), accumulatorInitialValue, aggregateFunction);
  }

  min(selector) {
    let iterator = this[Symbol.iterator]();
    const begin = iterator.next();
    if (begin.done === true) throw new Error("Source contains no elements");

    return this._aggregate(iterator, selector ? selector(begin.value) : begin.value, (accumulator, current) =>
      Math.min(accumulator, selector ? selector(current) : current)
    );
  }

  max(selector) {
    let iterator = this[Symbol.iterator]();
    const begin = iterator.next();
    if (begin.done === true) throw new Error("Source contains no elements");

    return this._aggregate(iterator, selector ? selector(begin.value) : begin.value, (accumulator, current) =>
      Math.max(accumulator, selector ? selector(current) : current)
    );
  }

  sum(selector) {
    return this._aggregate(this[Symbol.iterator](), 0, (accumulator, current) => accumulator + (selector ? selector(current) : current));
  }

  average(selector) {
    let iterator = this[Symbol.iterator]();
    const begin = iterator.next();
    if (begin.done === true) throw new Error("Source contains no elements");

    let count = 1;
    let sum = selector ? selector(begin.value) : begin.value;
    for (let currentState = iterator.next(); currentState.done === false; currentState = iterator.next()) {
      sum += selector ? selector(currentState.value) : currentState.value;
      count++;
    }

    return sum / count;
  }
};
