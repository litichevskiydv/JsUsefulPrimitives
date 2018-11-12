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
  expect(manipula.length).toBe(expectedArray.length);
  expect(actualArray).toIncludeSameMembers(expectedArray);
});

test("Should convert manipula to set of primitive type", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualSet = manipula.toSet();

  // Then
  expect(sourceArray).toSatisfyAll(x => actualSet.has(x));
});

test("Should convert manipula to set of complex type", () => {
  // Given
  const firstKey = new Key(1, 1);
  const secondKey = new Key(2, 2);
  const sourceArray = [firstKey, secondKey];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualSet = manipula.toSet(new KeysComparer());

  // Then
  expect(sourceArray).toSatisfyAll(x => actualSet.has(x));
  expect(actualSet.has(new Key(firstKey.hi, firstKey.lo))).toBeTrue();
});

test("Should convert manipula to map of primitive type", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualMap = manipula.toMap({
    keySelector: x => x,
    elementSelector: x => x * x
  });

  // Then
  expect(sourceArray).toSatisfyAll(x => actualMap.get(x) === x * x);
});

test("Should convert manipula to map of complex type", () => {
  // Given
  const sourceArray = [1, 2];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualMap = manipula.toMap({
    keySelector: x => new Key(x, x),
    elementSelector: x => x + 1,
    comparer: new KeysComparer()
  });

  // Then
  expect(sourceArray).toSatisfyAll(x => actualMap.get(new Key(x, x)) === x + 1);
});

describe("Should test select", () => {
  const testCases = [
    {
      toString: () => "Produce new collection",
      source: Manipula.from([1, 2, 3, 4, 5]),
      selector: x => x + 1,
      expected: [2, 3, 4, 5, 6]
    },
    {
      toString: () => "Produce new collection depends on element number",
      source: Manipula.from([1, 2, 3, 4, 5]),
      selector: (x, i) => x * i,
      expected: [0, 2, 6, 12, 20]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.select(testCase.selector);
    const actualArray = actual.toArray();

    // Then
    expect(actual.length).toBe(testCase.expected.length);
    expect(actualArray).toIncludeSameMembers(testCase.expected);
  });
});

describe("Should test where", () => {
  const testCases = [
    {
      toString: () => "Filter collection",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 2 === 0,
      expected: [2, 4, 6]
    },
    {
      toString: () => "Filter collection depends on element number",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: (x, i) => i % 2 === 0,
      expected: [1, 3, 5]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source.where(testCase.predicate).toArray();

    // Then
    expect(actual).toIncludeSameMembers(testCase.expected);
  });
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

describe("Should test count", () => {
  const testCases = [
    {
      toString: () => "Count without predicate should return collection length",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      expected: 6
    },
    {
      toString: () => "Count with predicate should return count of the satisfying elements",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 2 === 0,
      expected: 3
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source.count(testCase.predicate);

    // Thenq
    expect(actual).toBe(testCase.expected);
  });
});

describe("Should test first", () => {
  const testCases = [
    {
      toString: () => "First without predicate should return first element of not empty manipula",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      expected: 1
    },
    {
      toString: () => "First without predicate should throw error if manipula is empty",
      source: Manipula.from([]),
      expectedErrorMessage: "No matching element was found"
    },
    {
      toString: () => "First without predicate should return first matched element if it exists",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 3 === 0,
      expected: 3
    },
    {
      toString: () => "First without predicate should throw error if no matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 7 === 0,
      expectedErrorMessage: "No matching element was found"
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    if (testCase.expected) expect(testCase.source.first(testCase.predicate)).toBe(testCase.expected);
    else expect(() => testCase.source.first(testCase.predicate)).toThrowWithMessage(Error, testCase.expectedErrorMessage);
  });
});

test("Should return null on getting first or default element if no elements matches the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When
  let actualElement = manipula.firstOrDefault(x => x % 7 === 0);

  // Then
  expect(actualElement).toBeNull();
});

test("Should get single element", () => {
  // Given
  const sourceArray = [1];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualFirstElement = manipula.single();

  // Then
  const expectedFirstElement = sourceArray[0];
  expect(actualFirstElement).toBe(expectedFirstElement);
});

test("Should throw error on getting single element if collection is empty", () => {
  // Given
  const manipula = Manipula.from([]);

  // When, Then
  expect(() => manipula.single()).toThrowWithMessage(Error, "No matching element was found");
});

test("Should throw error on getting single element if collection contains more than one element", () => {
  // Given
  const manipula = Manipula.from([1, 2]);

  // When, Then
  expect(() => manipula.single()).toThrowWithMessage(Error, "More than one element was found");
});

test("Should get single element that matches the pattern", () => {
  // Given
  const sourceArray = [1, 2, 3, 4, 5, 6];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualFirstElement = manipula.single(x => x % 4 === 0);

  // Then
  const expectedFirstElement = sourceArray[3];
  expect(actualFirstElement).toBe(expectedFirstElement);
});

test("Should throw error on getting single element if no elements match the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When, Then
  expect(() => manipula.single(x => x % 7 === 0)).toThrowWithMessage(Error, "No matching element was found");
});

test("Should throw error on getting single element if more than one element match the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When, Then
  expect(() => manipula.single(x => x % 2 === 0)).toThrowWithMessage(Error, "More than one element was found");
});

test("Should return null on getting single or default element if collection is empty", () => {
  // Given
  const manipula = Manipula.from([]);

  // When, Then
  expect(manipula.singleOrDefault()).toBeNull();
});

test("Should return null on getting single or default if no elements match the pattern", () => {
  // Given
  const manipula = Manipula.from([1, 2, 3, 4, 5, 6]);

  // When, Then
  expect(manipula.singleOrDefault(x => x % 7 === 0)).toBeNull();
});

describe("Should test any", () => {
  const testCases = [
    {
      toString: () => "Any without predicate should return false on empty collection",
      source: Manipula.from([]),
      expected: false
    },
    {
      toString: () => "Any with predicate should return false on empty collection",
      source: Manipula.from([]),
      predicate: x => x % 2 === 0,
      expected: false
    },
    {
      toString: () => "Any without predicate should return true on not empty collection",
      source: Manipula.from([1, 2]),
      expected: true
    },
    {
      toString: () => "Any with predicate should detect compatible element",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x % 2 === 0,
      expected: true
    },
    {
      toString: () => "Any with predicate should not detect compatible element",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x % 5 === 0,
      expected: false
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source.any(testCase.predicate);

    // Thenq
    expect(actual).toBe(testCase.expected);
  });
});

describe("Should test all", () => {
  const testCases = [
    {
      toString: () => "Should return true on empty collection",
      source: Manipula.from([]),
      predicate: x => x % 2 === 0,
      expected: true
    },
    {
      toString: () => "Should approve collection",
      source: Manipula.from([2, 4, 6]),
      predicate: x => x % 2 === 0,
      expected: true
    },
    {
      toString: () => "Should not approve collection",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x % 2 === 0,
      expected: false
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source.all(testCase.predicate);

    // Thenq
    expect(actual).toBe(testCase.expected);
  });
});
