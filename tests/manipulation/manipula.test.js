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
