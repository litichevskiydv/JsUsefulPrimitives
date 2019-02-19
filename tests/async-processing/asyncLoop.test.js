const { forEachAsync, forAsync } = require("../../src/async-processing/asyncLoop");

test("Must compute sum of numbers in array via async foreach", async () => {
  // Given
  const array = [1, 2, 3, 4, 5];
  const expectedSum = array.reduce((accumulator, currentValue) => accumulator + currentValue);

  // When
  const finalState = await forEachAsync(array, (currentValue, loopState) => (loopState.sum += currentValue), { sum: 0 });

  // Then
  expect(finalState.sum).toBe(expectedSum);
});

test("Must break async foreach", async () => {
  // Given
  const array = [1, 2, 3, 4, 5];
  const expectedSum = array.filter(x => x <= 4).reduce((accumulator, currentValue) => accumulator + currentValue);

  // When
  const finalState = await forEachAsync(
    array,
    (currentValue, loopState) => {
      if (currentValue > 4) loopState.break = true;
      else loopState.sum += currentValue;
    },
    { sum: 0 }
  );

  // Then
  expect(finalState.sum).toBe(expectedSum);
});

test("Must compute sum of numbers in array via async for", async () => {
  // Given
  const array = [1, 2, 3, 4, 5];
  const expectedSum = array.reduce((accumulator, currentValue) => accumulator + currentValue);

  // When
  const finalState = await forAsync(0, array.length, (i, loopState) => (loopState.sum += array[i]), { sum: 0 });

  // Then
  expect(finalState.sum).toBe(expectedSum);
});

test("Must break async foreach", async () => {
  // Given
  const array = [1, 2, 3, 4, 5];
  const expectedSum = array.filter(x => x <= 4).reduce((accumulator, currentValue) => accumulator + currentValue);

  // When
  const finalState = await forAsync(
    0,
    array.length,
    (i, loopState) => {
      if (array[i] > 4) loopState.break = true;
      else loopState.sum += array[i];
    },
    { sum: 0 }
  );

  // Then
  expect(finalState.sum).toBe(expectedSum);
});
