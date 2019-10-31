module.exports = function(methodImplementation) {
  return async call => {
    const result = await methodImplementation(call);
    result.subscribe({
      next(message) {
        call.write(message);
      },
      error(err) {
        call.emit("error", err);
      },
      complete() {
        call.end();
      }
    });
  };
};
