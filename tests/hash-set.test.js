const HashSet = require("./../src/hash-set.js");

class BigNumber {
  constructor(hi, lo) {
    this.hi = hi;
    this.lo = lo;
  }
}

class BigNumbersComparer {
  getHashCode(obj) {
    let hash = 17;
    hash = hash * 31 + obj.hi;
    hash = hash * 31 + obj.lo;
    return hash;
  }

  equals(a, b) {
    return a.hi === b.hi && a.lo === b.lo;
  }
}

test("Should add value", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let value = new BigNumber(1, 1);

  // When
  hashSet.add(value);

  // Then
  expect(hashSet.has(value)).toBeTrue();
});

test("Should delete existed value", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);

  // Then
  expect(hashSet.delete(firstValue)).toBeTrue();
  expect(hashSet.has(firstValue)).toBeFalse();
  expect(hashSet.has(secondValue)).toBeTrue();
});

test("Should delete not existed value", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(secondValue);

  // Then
  expect(hashSet.delete(firstValue)).toBeFalse();
  expect(hashSet.has(secondValue)).toBeTrue();
});

test("Should clear collection", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);
  hashSet.clear();

  // Then
  expect(hashSet.has(firstValue)).toBeFalse();
  expect(hashSet.has(secondValue)).toBeFalse();
});

test("Should collect values", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);
  let values = [];
  hashSet.forEach(x => values.push(x));

  // Then
  expect(values).toIncludeSameMembers([firstValue, secondValue]);
});

test("Should get values", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);
  let values = Array.from(hashSet.values());

  // Then
  expect(values).toIncludeSameMembers([firstValue, secondValue]);
});

test("Should get entries", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);
  let values = Array.from(hashSet.entries());

  // Then
  expect(values).toIncludeSameMembers([firstValue, secondValue]);
});

test("Should iterate collection", () => {
  // Given
  let hashSet = new HashSet(new BigNumbersComparer());
  let firstValue = new BigNumber(1, 1);
  let secondValue = new BigNumber(2, 2);

  // When
  hashSet.add(firstValue);
  hashSet.add(secondValue);
  let values = Array.from(hashSet);

  // Then
  expect(values).toIncludeSameMembers([firstValue, secondValue]);
});
