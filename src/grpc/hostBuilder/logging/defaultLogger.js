const { serializeError } = require("serialize-error");

const log = (level, message, payload) => console.log(JSON.stringify(serializeError({ level, message, payload })));

const defaultLogger = {};
const defaultLevels = ["fatal", "error", "warn", "info", "debug"];
defaultLevels.forEach(level => (defaultLogger[level] = (message, payload) => log(level, message, payload || {})));

module.exports = defaultLogger;
