const Manipula = require("../../src/manipulation/manipula");

class Key {
  constructor(hi, lo) {
    this.hi = hi;
    this.lo = lo;
  }
}

class KeysComparer {
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

test("Should convert manipula to array", () => {
  // Given
  const expectedArray = [1, 2, 3, 4, 5];
  const manipula = Manipula.from(expectedArray);

  // When
  const actualArray = manipula.toArray();

  // Then
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should produce new collection", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5]);

  // When
  const actualArray = manipula.select(x => x + 1).toArray();

  // Then
  const expectedArray = [2, 3, 4, 5, 6];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should produce new collection depends on element number", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5]);

  // When
  const actualArray = manipula.select((x, i) => x * i).toArray();

  // Then
  const expectedArray = [0, 2, 6, 12, 20];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should filter collection", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When
  const actualArray = manipula.where(x => x % 2 === 0).toArray();

  // Then
  const expectedArray = [2, 4, 6];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should filter collection depends on element number", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When
  const actualArray = manipula.where((x, i) => i % 2 === 0).toArray();

  // Then
  const expectedArray = [1, 3, 5];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should concat collections", () => {
  // Given
  const manipula = Manipula.from([1, 2]);

  // When
  const actualArray = manipula
    .concat([3, 4])
    .concat([5, 6])
    .toArray();

  // Then
  const expectedArray = [1, 2, 3, 4, 5, 6];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should union collections of primitive type", () => {
  // Given
  const manipula = Manipula.from([5, 3, 9, 7, 5, 9, 3, 7]);

  // When
  const actualArray = manipula.union([8, 3, 6, 4, 4, 9, 1, 0]).toArray();

  // Then
  const expectedArray = [5, 3, 9, 7, 8, 6, 4, 1, 0];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should union collections of complex type", () => {
  // Given
  let firstKey = new Key(1, 1);
  let secondKey = new Key(2, 2);
  let thirdKey = new Key(2, 2);
  let fourthKey = new Key(1, 1);
  const manipula = Manipula.from([firstKey, secondKey]);

  // When
  const actualArray = manipula.union([thirdKey, fourthKey], new KeysComparer()).toArray();

  // Then
  const expectedArray = [firstKey, secondKey];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should subtracts sets of primitive type", () => {
  // Given
  const manipula = Manipula.from([2.0, 2.0, 2.1, 2.2, 2.3, 2.3, 2.4, 2.5]);

  // When
  const actualArray = manipula.except([2.2]).toArray();

  // Then
  const expectedArray = [2.0, 2.1, 2.3, 2.4, 2.5];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should subtracts sets of complex type", () => {
  // Given
  let firstKey = new Key(1, 1);
  let secondKey = new Key(2, 2);
  let thirdKey = new Key(2, 2);
  let fourthKey = new Key(1, 1);
  const manipula = Manipula.from([firstKey, secondKey, thirdKey]);

  // When
  const actualArray = manipula.except([fourthKey], new KeysComparer()).toArray();

  // Then
  const expectedArray = [secondKey];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should distinct collection of primitive type", () => {
  // Given
  const manipula = Manipula.from([2.0, 2.0, 2.1, 2.2, 2.3, 2.3, 2.4, 2.5]);

  // When
  const actualArray = manipula.distinct().toArray();

  // Then
  const expectedArray = [2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should distinct collection of complex type", () => {
  // Given
  let firstKey = new Key(1, 1);
  let secondKey = new Key(2, 2);
  let thirdKey = new Key(2, 2);
  let fourthKey = new Key(1, 1);
  const manipula = Manipula.from([firstKey, secondKey, thirdKey, fourthKey]);

  // When
  const actualArray = manipula.distinct(new KeysComparer()).toArray();

  // Then
  const expectedArray = [firstKey, secondKey];
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should calculate elements count", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5, 6];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualCount = manipula.count();

  // Then
  expect(actualCount).toBe(sourceArray.length);
});

test("Should calculate the number of elements satisfying the predicate", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When
  const actualCount = manipula.count(x => x % 2 === 0);

  // Then
  expect(actualCount).toBe(3);
});

test("Should get first element", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5, 6];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualFirstElement = manipula.first();

  // Then
  const expectedFirstElement = sourceArray[0];
  expect(actualFirstElement).toBe(expectedFirstElement);
});

test("Should throw error on getting first element if collection is empty", () => {
  // Given
  const manipula = Manipula.from([]);

  // When, Then
  expect.toThrowWithMessage(() => manipula.first(), "No matching element was found");
});

test("Should get first element that matches the pattern", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5, 6];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualFirstElement = manipula.first(x => x % 3 === 0);

  // Then
  const expectedFirstElement = sourceArray[2];
  expect(actualFirstElement).toBe(expectedFirstElement);
});

test("Should throw error on getting first element if no elements matches the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When, Then
  expect.toThrowWithMessage(() => manipula.first(x => x % 7 === 0), "No matching element was found");
});

test("Should return null on getting first or default element if collection is empty", () => {
  // Given
  const manipula = Manipula.from([]);

  // When
  let actualElement = manipula.firstOrDefault();

  // Then
  expect(actualElement).toBeNull();
});

test("Should return null on getting first or default element if no elements matches the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When
  let actualElement = manipula.first(x => x % 7 === 0);

  // Then
  expect(actualElement).toBeNull();
});
