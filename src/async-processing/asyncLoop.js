function forEachBody(iterator, body, loopState, callback) {
  const iteratorState = iterator.next();
  if (iteratorState.done || loopState.break === true) callback(loopState);
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

function forBody(i, toExclusive, body, loopState, callback) {
  if (i === toExclusive || loopState.break === true) callback(loopState);
  else {
    body(i, loopState);
    setImmediate(forBody.bind(null, i + 1, toExclusive, body, loopState, callback));
  }
}

module.exports.forAsync = async function(fromInclusive, toExclusive, body, loopState) {
  return await new Promise(resolve => {
    forBody(fromInclusive, toExclusive, body, loopState, resolve);
  });
};
