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

const otherFunction = x => x;
const differentFunction = x => x;

module.exports.commonCases = [
  {
    toString: () => "Number and String mustn't be equal",
    first: 1,
    second: "1",
    expected: false
  },
  {
    toString: () => "Number and Boolean mustn't be equal",
    first: 1,
    second: true,
    expected: false
  },

  {
    toString: () => "Number and Null mustn't be equal",
    first: 1,
    second: null,
    expected: false
  },
  {
    toString: () => "Number and Undefined mustn't be equal",
    first: 1,
    second: undefined,
    expected: false
  },
  {
    toString: () => "Number and Object mustn't be equal",
    first: 1,
    second: { value: 1 },
    expected: false
  },
  {
    toString: () => "Number and Function mustn't be equal",
    first: 1,
    second: otherFunction,
    expected: false
  },
  {
    toString: () => "Must determine the equality of nulls",
    first: null,
    second: null,
    expected: true
  },
  {
    toString: () => "Must determine the equality of undefineds",
    first: undefined,
    second: undefined,
    expected: true
  },
  {
    toString: () => "Must determine the equality of booleans",
    first: false,
    second: false,
    expected: true
  },
  {
    toString: () => "Must determine the equality of numbers",
    first: 15,
    second: 15,
    expected: true
  },
  {
    toString: () => "Must determine the equality of strings",
    first: "test",
    second: "test",
    expected: true
  },
  {
    toString: () => "Must determine the equality of functions",
    first: otherFunction,
    second: otherFunction,
    expected: true
  },
  {
    toString: () => "Must determine the equality of dates",
    first: new Date(1387585278000),
    second: new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)"),
    expected: true
  },
  {
    toString: () => "Must determine the inequality of booleans",
    first: false,
    second: true,
    expected: false
  },
  {
    toString: () => "Must determine the inequality of numbers",
    first: 15,
    second: 20,
    expected: false
  },
  {
    toString: () => "Must determine the inequality of strings",
    first: "test1",
    second: "test2",
    expected: false
  },
  {
    toString: () => "Must determine the inequality of functions",
    first: otherFunction,
    second: differentFunction,
    expected: false
  },
  {
    toString: () => "Must determine the inequality of dates",
    first: new Date(1387585278000),
    second: new Date("Fri Dec 20 2000 16:21:18 GMT-0800 (PST)"),
    expected: false
  },
  {
    toString: () => "Must determine the equality of arrays of numbers",
    first: [1, 2, 3],
    second: [1, 2, 3],
    expected: true
  },
  {
    toString: () => "Must determine the equality of array and arguments of numbers",
    first: [1, 2, 3],
    second: (function() {
      return arguments;
    })(1, 2, 3),
    expected: true
  },
  {
    toString: () => "Must determine the inequality of arrays of numbers",
    first: [1, 2, 3],
    second: [1, 5, 3],
    expected: false
  },
  {
    toString: () => "Must determine the equality of array and arguments of numbers",
    first: [1, 2, 3],
    second: (function() {
      return arguments;
    })(1, 2, 4),
    expected: false
  },
  {
    toString: () => "Must determine the equality of arrays of numbers ignoring order",
    first: [3, 2, 1],
    second: [1, 2, 3],
    options: { ignoreCollectionOrder: true },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of arrays of numbers ignoring order",
    first: [1, 1, 2, 2, 1],
    second: [1, 1, 2, 2, 2],
    options: { ignoreCollectionOrder: true },
    expected: false
  },
  {
    toString: () => "Must determine the inequality of array and various object",
    first: [1, 2, 3],
    second: { value: 1 },
    expected: false
  },

  {
    toString: () => "Must determine the inequality of objects by comparing keys names",
    first: { a: 2, b: 2 },
    second: { b: 2, d: 2 },
    expected: false
  },
  {
    toString: () => "Must determine the equality of objects by deep comparing keys values",
    first: { a: { id: 123, name: "test" }, b: { id: 345, description: "text" } },
    second: { a: { id: 123, name: "test" }, b: { id: 345, description: "text" } },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of objects by deep comparing keys values",
    first: { a: { id: 123, name: "test1" }, b: { id: 345, description: "text2" } },
    second: { a: { id: 123, name: "test2" }, b: { id: 345, description: "text1" } },
    expected: false
  },
  {
    toString: () => "Must determine the equality of objects with inner collection ignoring its order",
    first: { a: { id: 123, name: "test" }, b: ["ab", "ac", "ad"] },
    second: { a: { id: 123, name: "test" }, b: ["ad", "ac", "ab"] },
    options: { ignoreCollectionOrder: true },
    expected: true
  },
  {
    toString: () => "Must determine the equality of arrays of complex type",
    first: [new Key(1, 1), new Key(2, 2), new Key(3, 3)],
    second: [new Key(1, 1), new Key(2, 2), new Key(3, 3)],
    expected: true
  },
  {
    toString: () => "Must determine the inequality of complex types to anonymous object with same structure",
    first: new Key(1, 1),
    second: { hi: 1, lo: 1 },
    expected: false
  },
  {
    toString: () =>
      "Must determine the equality of complex type object to anonymous object with same structure if comparison of constructors was ignored",
    first: new Key(1, 1),
    second: { hi: 1, lo: 1 },
    options: { ignoreObjectTypes: true },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of complex types with same structure and different constructors",
    first: new Key(1, 1),
    second: new OtherKey(1, 1),
    expected: false
  }
];

module.exports.equalsSpecialCases = [
  {
    toString: () => "Must exclude class member from comparison",
    first: new Key(1, 1),
    second: new Key(1, 2),
    options: { membersToIgnore: new Set(["Key.lo"]) },
    expected: true
  },
  {
    toString: () => "Must exclude anonymous types member from comparison",
    first: { id: 1, value: "test" },
    second: { id: 0, value: "test" },
    options: { membersToIgnore: new Set(["Object.id"]) },
    expected: true
  },
  {
    toString: () => "Must use external comperer for classes",
    first: new Key(2, 1),
    second: new Key(1, 2),
    options: { customComparers: new Map([[Key.prototype, (a, b) => a.hi + a.lo === b.hi + b.lo]]) },
    expected: true
  },
  {
    toString: () => "Must determine the equality of objects by checking both equalses",
    first: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    second: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of objects by checking both equalses",
    first: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    second: {
      a: 1,
      b: 2,
      c: 3,
      equals: function(other) {
        return this.a === other.a && this.b === other.b && this.c === other.c;
      }
    },
    expected: false
  },
  {
    toString: () => "Must determine the equality of objects by checking equals defined in first object",
    first: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    second: { a: 1, b: 2, c: 3 },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of objects by checking equals defined in first object",
    first: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    second: { a: 2, b: 2, c: 3 },
    expected: false
  },
  {
    toString: () => "Must determine the equality of objects by checking equals defined in second object",
    first: { a: 1, b: 2, c: 3 },
    second: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    expected: true
  },
  {
    toString: () => "Must determine the inequality of objects by checking equals defined in second object",
    first: { a: 2, b: 2, c: 3 },
    second: {
      a: 1,
      b: 2,
      equals: function(other) {
        return this.a === other.a && this.b === other.b;
      }
    },
    expected: false
  }
];

module.exports.equalsAllCases = this.commonCases.concat(this.equalsSpecialCases);
