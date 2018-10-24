const Manipula = require("../../src/manipulation/manipula");

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
