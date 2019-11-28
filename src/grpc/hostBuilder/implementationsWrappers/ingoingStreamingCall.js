const { streamToRx } = require("rxjs-stream");

module.exports = function(methodImplementation) {
  return async (call, callback) => {
    call.source = streamToRx(call);
    callback(null, await methodImplementation(call));
  };
};
