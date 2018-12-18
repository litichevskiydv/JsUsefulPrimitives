const Manipula = require("../../src/manipulation/index");

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
  const actualMap = manipula.toMap(x => x, { elementSelector: x => x * x });

  // Then
  expect(sourceArray).toSatisfyAll(x => actualMap.get(x) === x * x);
});

test("Should convert manipula to map of complex type", () => {
  // Given
  const sourceArray = [1, 2];
  const manipula = Manipula.from(sourceArray);

  // When
  const actualMap = manipula.toMap(x => new Key(x, x), {
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

describe("Should test selectMany", () => {
  const testCases = [
    {
      toString: () => "Produce new collection",
      source: Manipula.from([Manipula.from([1, 2]), Manipula.from([3, 4]), Manipula.from([5])]),
      selector: x => x.select(value => value + 1),
      expected: [2, 3, 4, 5, 6]
    },
    {
      toString: () => "Produce new collection depends on element number",
      source: Manipula.from([Manipula.from([1, 2]), Manipula.from([3, 4]), Manipula.from([5])]),
      selector: (x, i) => x.select(value => value * i),
      expected: [0, 0, 3, 4, 10]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.selectMany(testCase.selector).toArray();

    // Then
    expect(actual.length).toBe(testCase.expected.length);
    expect(actual).toIncludeSameMembers(testCase.expected);
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

describe("Should test union", () => {
  const testCases = [
    {
      toString: () => "Unioning collections of primitive type",
      first: Manipula.from([5, 3, 9, 7, 5, 9, 3, 7]),
      second: Manipula.from([8, 3, 6, 4, 4, 9, 1, 0]),
      expected: [5, 3, 9, 7, 8, 6, 4, 1, 0]
    },
    {
      toString: () => "Unioning collections of primitive type",
      first: Manipula.from([new Key(1, 1), new Key(2, 2)]),
      second: Manipula.from([new Key(2, 2), new Key(1, 1)]),
      comparer: new KeysComparer(),
      expected: [new Key(1, 1), new Key(2, 2)]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.first.union(testCase.second, testCase.comparer).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test except", () => {
  const testCases = [
    {
      toString: () => "Subtracting same collections",
      first: Manipula.from([1, 2, 3]),
      second: Manipula.from([1, 2, 3]),
      expected: []
    },
    {
      toString: () => "Subtracting collections of primitive types with different elements",
      first: Manipula.from([1, 2, 2, 3, 4]),
      second: Manipula.from([5, 2, 3, 2, 8]),
      expected: [1, 4]
    },
    {
      toString: () => "Subtracting collections of complex types with different elements",
      first: Manipula.from([new Key(1, 1), new Key(2, 2), new Key(2, 2), new Key(3, 3), new Key(4, 4)]),
      second: Manipula.from([new Key(5, 5), new Key(2, 2), new Key(3, 3), new Key(2, 2), new Key(8, 8)]),
      comparer: new KeysComparer(),
      expected: [new Key(1, 1), new Key(4, 4)]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.first.except(testCase.second, testCase.comparer).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test distinct", () => {
  const testCases = [
    {
      toString: () => "Distincting collections of primitive type",
      source: Manipula.from([2.0, 2.0, 2.1, 2.2, 2.3, 2.3, 2.4, 2.5]),
      expected: [2.0, 2.1, 2.2, 2.3, 2.4, 2.5]
    },
    {
      toString: () => "Distincting collections of primitive type",
      source: Manipula.from([new Key(1, 1), new Key(2, 2), new Key(2, 2), new Key(1, 1)]),
      comparer: new KeysComparer(),
      expected: [new Key(1, 1), new Key(2, 2)]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.distinct(testCase.comparer).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
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
      toString: () => "First with predicate should return first matched element if it exists",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 3 === 0,
      expected: 3
    },
    {
      toString: () => "First with predicate should throw error if no matching element was found",
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

describe("Should test firstOrDefault", () => {
  const testCases = [
    {
      toString: () => "FirstOrDefault without predicate should return first element of not empty manipula",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      expected: 1
    },
    {
      toString: () => "FirstOrDefault without predicate should return null if manipula is empty",
      source: Manipula.from([]),
      expected: null
    },
    {
      toString: () => "FirstOrDefault with predicate should return first matched element if it exists",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 3 === 0,
      expected: 3
    },
    {
      toString: () => "FirstOrDefault with predicate should return null if no matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 7 === 0,
      expected: null
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    expect(testCase.source.firstOrDefault(testCase.predicate)).toBe(testCase.expected);
  });
});

describe("Should test single", () => {
  const testCases = [
    {
      toString: () => "Single without predicate should return single element of not empty manipula",
      source: Manipula.from([1]),
      expected: 1
    },
    {
      toString: () => "Single without predicate should throw error if manipula is empty",
      source: Manipula.from([]),
      expectedErrorMessage: "No matching element was found"
    },
    {
      toString: () => "Single without predicate should throw error if manipula contains more than one element",
      source: Manipula.from([1, 2]),
      expectedErrorMessage: "More than one element was found"
    },
    {
      toString: () => "Single with predicate should return single matched element if one element matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 4 === 0,
      expected: 4
    },
    {
      toString: () => "Single with predicate should throw error if no matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 7 === 0,
      expectedErrorMessage: "No matching element was found"
    },
    {
      toString: () => "Single with predicate should throw error if more than one element matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 2 === 0,
      expectedErrorMessage: "More than one element was found"
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    if (testCase.expected) expect(testCase.source.single(testCase.predicate)).toBe(testCase.expected);
    else expect(() => testCase.source.single(testCase.predicate)).toThrowWithMessage(Error, testCase.expectedErrorMessage);
  });
});

describe("Should test singleOrDefault", () => {
  const testCases = [
    {
      toString: () => "SingleOrDefault without predicate should return single element of not empty manipula",
      source: Manipula.from([1]),
      expected: 1
    },
    {
      toString: () => "SingleOrDefault without predicate should return null if manipula is empty",
      source: Manipula.from([]),
      expected: null
    },
    {
      toString: () => "SingleOrDefault without predicate should throw error if manipula contains more than one element",
      source: Manipula.from([1, 2]),
      expectedErrorMessage: "More than one element was found"
    },
    {
      toString: () => "SingleOrDefault with predicate should return single matched element if one element matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 4 === 0,
      expected: 4
    },
    {
      toString: () => "SingleOrDefault with predicate should return null if no matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 7 === 0,
      expected: null
    },
    {
      toString: () => "SingleOrDefault with predicate should throw error if more than one element matching element was found",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      predicate: x => x % 2 === 0,
      expectedErrorMessage: "More than one element was found"
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    if (testCase.expected !== undefined) expect(testCase.source.singleOrDefault(testCase.predicate)).toBe(testCase.expected);
    else expect(() => testCase.source.singleOrDefault(testCase.predicate)).toThrowWithMessage(Error, testCase.expectedErrorMessage);
  });
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

describe("Should test contains", () => {
  const testCases = [
    {
      toString: () => "Should not find value of primitive type",
      source: Manipula.from([1, 2, 3]),
      value: 4,
      expected: false
    },
    {
      toString: () => "Should not find value of complex type",
      source: Manipula.from([new Key(1, 1), new Key(2, 2), new Key(3, 3)]),
      value: new Key(4, 4),
      comparer: new KeysComparer(),
      expected: false
    },
    {
      toString: () => "Should find value of primitive type",
      source: Manipula.from([1, 2, 3]),
      value: 2,
      expected: true
    },
    {
      toString: () => "Should not find value of complex type",
      source: Manipula.from([new Key(1, 1), new Key(2, 2), new Key(3, 3)]),
      value: new Key(2, 2),
      comparer: new KeysComparer(),
      expected: true
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source.contains(testCase.value, testCase.comparer);

    // Thenq
    expect(actual).toBe(testCase.expected);
  });
});

describe("Should test groupBy", () => {
  const testCases = [
    {
      toString: () => "Should group by simple key without results transformation",
      source: Manipula.from([{ key: 1, value: 2 }, { key: 1, value: 3 }, { key: 2, value: 4 }]),
      keySelector: x => x.key,
      expected: [[{ key: 1, value: 2 }, { key: 1, value: 3 }], [{ key: 2, value: 4 }]]
    },
    {
      toString: () => "Should group by simple key and transform results",
      source: Manipula.from([{ key: 1, value: 2 }, { key: 1, value: 3 }, { key: 2, value: 4 }]),
      keySelector: x => x.key,
      options: { elementSelector: x => x.value },
      expected: [[2, 3], [4]]
    },
    {
      toString: () => "Should group by complex key without results transformation",
      source: Manipula.from([{ key: new Key(1, 1), value: 2 }, { key: new Key(1, 1), value: 3 }, { key: new Key(2, 2), value: 4 }]),
      keySelector: x => x.key,
      options: { comparer: new KeysComparer() },
      expected: [[{ key: new Key(1, 1), value: 2 }, { key: new Key(1, 1), value: 3 }], [{ key: new Key(2, 2), value: 4 }]]
    },
    {
      toString: () => "Should group by complex key and transform results",
      source: Manipula.from([{ key: new Key(1, 1), value: 2 }, { key: new Key(1, 1), value: 3 }, { key: new Key(2, 2), value: 4 }]),
      keySelector: x => x.key,
      options: { comparer: new KeysComparer(), elementSelector: x => x.value },
      expected: [[2, 3], [4]]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    let actual = testCase.source
      .groupBy(testCase.keySelector, testCase.options)
      .select(x => x.toArray())
      .toArray();

    // Thenq
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test append", () => {
  const testCases = [
    {
      toString: () => "Append element to empty source",
      source: Manipula.from([]),
      element: 1,
      expected: [1]
    },
    {
      toString: () => "Append element to not empty source",
      source: Manipula.from([1, 2, 3]),
      element: 4,
      expected: [1, 2, 3, 4]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.append(testCase.element).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test intersect", () => {
  const testCases = [
    {
      toString: () => "Intersect collections without common elements",
      first: Manipula.from([1, 2, 3]),
      second: Manipula.from([4, 5, 6]),
      expected: []
    },
    {
      toString: () => "Intersect collections of primitive types with common elements",
      first: Manipula.from([1, 2, 2, 3, 4]),
      second: Manipula.from([5, 2, 3, 2, 8]),
      expected: [2, 3]
    },
    {
      toString: () => "Intersect collections of complex types with common elements",
      first: Manipula.from([new Key(1, 1), new Key(2, 2), new Key(2, 2), new Key(3, 3), new Key(4, 4)]),
      second: Manipula.from([new Key(5, 5), new Key(2, 2), new Key(3, 3), new Key(2, 2), new Key(8, 8)]),
      comparer: new KeysComparer(),
      expected: [new Key(2, 2), new Key(3, 3)]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.first.intersect(testCase.second, testCase.comparer).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test skip", () => {
  const testCases = [
    {
      toString: () => "Skip less than elements count",
      source: Manipula.from([1, 2, 3]),
      count: 2,
      expected: [3]
    },
    {
      toString: () => "Skip more than elements count",
      source: Manipula.from([1, 2, 3]),
      count: 4,
      expected: []
    },
    {
      toString: () => "Skip negative count",
      source: Manipula.from([1, 2, 3]),
      count: -1,
      expected: [1, 2, 3]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.skip(testCase.count).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test take", () => {
  const testCases = [
    {
      toString: () => "Take less than elements count",
      source: Manipula.from([1, 2, 3]),
      count: 2,
      expected: [1, 2]
    },
    {
      toString: () => "Take more than elements count",
      source: Manipula.from([1, 2, 3]),
      count: 4,
      expected: [1, 2, 3]
    },
    {
      toString: () => "Take negative count",
      source: Manipula.from([1, 2, 3]),
      count: -1,
      expected: []
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.take(testCase.count).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test skipWhile", () => {
  const testCases = [
    {
      toString: () => "Skip all elements",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x < 4,
      expected: []
    },
    {
      toString: () => "Skip nothing",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x > 4,
      expected: [1, 2, 3]
    },
    {
      toString: () => "Skip two elements",
      source: Manipula.from([1, 2, 3]),
      predicate: (x, i) => x + i <= 3,
      expected: [3]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.skipWhile(testCase.predicate).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test takeWhile", () => {
  const testCases = [
    {
      toString: () => "Take all elements",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x < 4,
      expected: [1, 2, 3]
    },
    {
      toString: () => "Take nothing",
      source: Manipula.from([1, 2, 3]),
      predicate: x => x > 4,
      expected: []
    },
    {
      toString: () => "Take two elements",
      source: Manipula.from([1, 2, 3]),
      predicate: (x, i) => x + i <= 3,
      expected: [1, 2]
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = testCase.source.takeWhile(testCase.predicate).toArray();

    // Then
    expect(actual).toEqual(testCase.expected);
  });
});

describe("Should test elementAt", () => {
  const testCases = [
    {
      toString: () => "ElementAt should locate element by index",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: 1,
      expected: 2
    },
    {
      toString: () => "ElementAt should throw error if index is greater or equal to source size",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: 15,
      expectedErrorMessage: "Index 15 lies out of range"
    },
    {
      toString: () => "ElementAt should throw error if index is less than zero",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: -1,
      expectedErrorMessage: "Index -1 lies out of range"
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    if (testCase.expected) expect(testCase.source.elementAt(testCase.index)).toBe(testCase.expected);
    else expect(() => testCase.source.elementAt(testCase.index)).toThrowWithMessage(Error, testCase.expectedErrorMessage);
  });
});

describe("Should test elementAtOrDefault", () => {
  const testCases = [
    {
      toString: () => "ElementAtOrDefault should locate element by index",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: 1,
      expected: 2
    },
    {
      toString: () => "ElementAtOrDefault should return null if index is greater or equal to source size",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: 15,
      expected: null
    },
    {
      toString: () => "ElementAtOrDefault should return null if index is less than zero",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      index: -1,
      expected: null
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    expect(testCase.source.elementAtOrDefault(testCase.index)).toBe(testCase.expected);
  });
});

describe("Should test aggregate", () => {
  const testCases = [
    {
      toString: () => "Should aggregate collection",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      accumulatorInitialValue: 1,
      aggregateFunction: (accumulator, current) => accumulator + current,
      expected: 22
    },
    {
      toString: () => "Should aggregate collection based on item number",
      source: Manipula.from([1, 2, 3, 4, 5, 6]),
      accumulatorInitialValue: 1,
      aggregateFunction: (accumulator, current, index) => accumulator + current * index,
      expected: 71
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When, Then
    expect(testCase.source.aggregate(testCase.accumulatorInitialValue, testCase.aggregateFunction)).toBe(testCase.expected);
  });
});
