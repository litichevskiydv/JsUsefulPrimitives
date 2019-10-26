const { streamToRx } = require("rxjs-stream");

module.exports = function(methodImplementation) {
  return async (call, callback) => {
    call.source = streamToRx(call);
    const result = await methodImplementation(call);

    if (result.subscribe && typeof result.subscribe === "function")
      result.subscribe({
        next(message) {
          callback(null, message);
        },
        error(err) {
          callback(err);
        }
      });
    else callback(null, result);
  };
};
