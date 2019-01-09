function forEachBody(iterator, body, loopState, callback) {
  const iteratorState = iterator.next();
  if (iteratorState.done) callback(loopState);
  else {
    body(iteratorState.value, loopState);
    setImmediate(forEachBody.bind(null, iterator, body, loopState, callback));
  }
}

module.exports.forEachAsync = async function(source, body, loopState) {
  return await new Promise(resolve => {
    forEachBody(source[Symbol.iterator](), body, loopState, resolve);
  });
};
