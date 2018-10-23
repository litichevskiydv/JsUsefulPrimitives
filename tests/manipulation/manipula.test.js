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

test("Should change collection", () => {
    // Given
    const manipula = Manipula.from([1, 2, 3, 4, 5]);

    // When
    const actualArray = manipula.select((x, i) => x * i).toArray();

    // Then
    const expectedArray = [0, 2, 6, 12, 20];
    expect(actualArray).toIncludeSameMembers(expectedArray);
});
