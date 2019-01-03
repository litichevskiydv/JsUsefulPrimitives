function equalsForIterables(first, second, options) {
  const firstArray = Array.from(first);
  const secondArray = Array.from(second);
  if (firstArray.length !== secondArray.length) return false;

  let usedMask = Array(secondArray.length).fill(false);
  for (let i = 0; i < firstArray.length; i++) {
    const leftBound = options.ignoreCollectionOrder ? 0 : i;
    const rightBound = options.ignoreCollectionOrder ? secondArray.length : i + 1;
    for (var j = leftBound; j < rightBound; j++)
      if (!usedMask[j] && equals(firstArray[i], secondArray[j], options)) {
        usedMask[j] = true;
        break;
      }

    if (j === rightBound) return false;
  }

  return true;
}

function equalsForVariousObjects(first, second, options) {
  const firstEquals = first["equals"];
  const secondEquals = second["equals"];
  if (firstEquals && secondEquals) return first.equals(second) && second.equals(first);
  if (firstEquals) return first.equals(second);
  if (secondEquals) return second.equals(first);

  const firstPrototype = Object.getPrototypeOf(first);
  const arePrototypesEqual = firstPrototype === Object.getPrototypeOf(second);
  if (!options.ignoreObjectTypes && arePrototypesEqual === false) return false;

  const customComparer = options.customComparers.get(firstPrototype);
  if (arePrototypesEqual && customComparer) return customComparer(first, second);

  const firstKeys = Object.keys(first).sort();
  const secondKeys = Object.keys(second).sort();
  if (firstKeys.length !== secondKeys.length) return false;
  for (let i = 0; i < firstKeys.length; i++) if (firstKeys[i] !== secondKeys[i]) return false;
  for (const key of firstKeys) {
    if (arePrototypesEqual && options.membersToIgnore.has(`${firstPrototype.constructor.name}.${key}`)) continue;

    if (equals(first[key], second[key], options) === false) return false;
  }

  return true;
}

function equals(first, second, options) {
  const opts = options || {};
  if (!opts.membersToIgnore) opts.membersToIgnore = new Set();
  if (!opts.customComparers) opts.customComparers = new Map();

  if (first === second) return true;

  const firstType = typeof first;
  if (firstType !== typeof second || firstType !== "object") return false;

  if (first instanceof Date && second instanceof Date) return first.getTime() === second.getTime();

  if (first[Symbol.iterator] && second[Symbol.iterator]) return equalsForIterables(first, second, opts);

  return equalsForVariousObjects(first, second, opts);
}

module.exports.equals = equals;
