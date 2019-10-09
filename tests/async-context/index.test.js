const asyncContext = require("../../src/async-context");

test("Must pass context to child asynchronous operation", async () => {
  // Given
  const key = "counter";
  const initialValue = 3;

  // When
  asyncContext.storage.createContext().set(key, initialValue);
  const actualValue = await new Promise(resolve => resolve(asyncContext.getValue(key) + 2));

  // Then
  const expectedValue = 5;
  expect(actualValue).toBe(expectedValue);
});

test("Must not corrupt parent context", async () => {
  // Given
  const key = "counter";
  const initialValue = 3;

  // When
  asyncContext.storage.createContext().set(key, initialValue);
  const actualValue = await new Promise(async resolve => {
    await new Promise(childResolve => {
      asyncContext.setValue(key, asyncContext.getValue(key) + 2);
      childResolve();
    });
    resolve(asyncContext.getValue(key));
  });

  // Then
  expect(actualValue).toBe(initialValue);
});

test("Must pass named context to child asynchronous operation", async () => {
  // Given
  const firstKey = "firstCounter";
  const firstValue = 3;

  const contextName = "NamedContext";
  const secondKey = "secondCounter";
  const secondValue = 1;

  // When
  asyncContext.storage.createContext().set(firstKey, firstValue);
  asyncContext.storage.createContext(contextName).set(secondKey, secondValue);
  const actualValue = await new Promise(resolve => resolve(asyncContext.storage.getContext(contextName).get(secondKey) + 2));

  // Then
  const expectedValue = 3;
  expect(actualValue).toBe(expectedValue);
});
