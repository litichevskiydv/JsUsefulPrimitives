const { getHashCode } = require("../../src/comparison/getHashCode");

class Key {
  constructor(hi, lo) {
    this.hi = hi;
    this.lo = lo;
  }
}

class OtherKey {
  constructor(hi, lo) {
    this.hi = hi;
    this.lo = lo;
  }
}

describe("Should test getHashCode", () => {
  const otherFunction = x => x;
  const differentFunction = x => x;

  const testCases = [
    {
      toString: () => "Hashcode for null must be zero",
      operand: null,
      expected: 0
    },
    {
      toString: () => "Hashcode for undefined must be zero",
      operand: undefined,
      expected: 0
    },
    {
      toString: () => "Hashcode for true must be one",
      operand: true,
      expected: 1
    },
    {
      toString: () => "Hashcode for false must be one",
      operand: false,
      expected: 0
    },
    {
      toString: () => "Hashcode for an integer number must be itself",
      operand: 123,
      expected: 123
    },
    {
      toString: () => "Hashcode for a fractional number must be itself",
      operand: 12.3,
      expected: 12.3
    },
    {
      toString: () => "Must calculate hashcode for string",
      operand: "test",
      expected: 3545544
    },
    {
      toString: () => "Must calculate hashcode for array of strings",
      operand: ["ab", "ac", "ad", "ae"],
      expected: 87516412
    },
    {
      toString: () => "Must calculate hashcode for ascending order array of strings ignoring collection order",
      operand: ["ab", "ac", "ad", "ae"],
      options: { ignoreCollectionOrder: true },
      expected: 87811452
    },
    {
      toString: () => "Must calculate hashcode for descending order array of strings ignoring collection order",
      operand: ["ae", "ad", "ac", "ab"],
      options: { ignoreCollectionOrder: true },
      expected: 87811452
    },
    {
      toString: () => "Must calculate hashcode for Date",
      operand: new Date(1387585278000),
      expected: 1387585278000
    },
    {
      toString: () => "Must calculate hashcode for object with getHashCode method",
      operand: {
        a: 1,
        b: 2,
        getHashCode: function() {
          return this.a + this.b;
        }
      },
      expected: 3
    },
    {
      toString: () => "Must calculate hashcode for object without getHashCode method",
      operand: { a: 1, b: 2 },
      expected: -191014771
    },
    {
      toString: () => "Must calculate hashcode for Key",
      operand: new Key(1, 1),
      expected: 1199425
    },
    {
      toString: () => "Must calculate hashcode for OtherKey",
      operand: new OtherKey(1, 1),
      expected: 1820041547
    },
    {
      toString: () => "Must calculate hashcode for Key ignoring type",
      operand: new Key(1, 1),
      options: { ignoreObjectTypes: true },
      expected: 3224950
    },
    {
      toString: () => "Must calculate hashcode for OtherKey ignoring type",
      operand: new OtherKey(1, 1),
      options: { ignoreObjectTypes: true },
      expected: 3224950
    }
  ];

  test.each(testCases)("%s", testCase => {
    // When
    const actual = getHashCode(testCase.operand, testCase.options);

    // Then
    expect(actual).toBe(testCase.expected);
  });
});

describe("Should verify getHashCode by equals", () => {
  test.each(require("./testsData").commonCases)("%s", testCase => {
    // When
    const getHashCodeCheckingResult = getHashCode(testCase.first, testCase.options) === getHashCode(testCase.second, testCase.options);

    // Then
    expect((testCase.expected && getHashCodeCheckingResult) || testCase.expected === false).toBeTrue();
  });
});
