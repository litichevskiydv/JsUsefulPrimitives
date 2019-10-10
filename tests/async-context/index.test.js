const asyncHooks = require("async_hooks");
const asyncContext = require("../../src/async-context");
const defaultContext = asyncContext.default;

test("Must pass context to child asynchronous operation", async () => {
  // Given
  const key = "counter";
  const initialValue = 3;

  // When
  asyncContext.create().set(key, initialValue);
  const actualValue = await new Promise(resolve => resolve(defaultContext.get(key) + 2));

  // Then
  const expectedValue = 5;
  expect(actualValue).toBe(expectedValue);
});

test("Must not corrupt parent context", async () => {
  // Given
  const key = "counter";
  const initialValue = 3;

  // When
  asyncContext.create().set(key, initialValue);
  const actualValue = await new Promise(async resolve => {
    await new Promise(childResolve => {
      defaultContext.set(key, defaultContext.get(key) + 2);
      childResolve();
    });
    resolve(defaultContext.get(key));
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
  asyncContext.create().set(firstKey, firstValue);
  asyncContext.create(contextName).set(secondKey, secondValue);
  const actualValue = await new Promise(resolve => resolve(asyncContext.obtain(contextName).get(secondKey) + 2));

  // Then
  const expectedValue = 3;
  expect(actualValue).toBe(expectedValue);
});
