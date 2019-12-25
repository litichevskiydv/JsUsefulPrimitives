const camelCase = require("camelcase");

module.exports = function convertFieldsCase(scheme) {
  if (scheme.fields) for (const fieldScheme of scheme.fields) fieldScheme.name = camelCase(fieldScheme.name);
  if (scheme.messages) for (const messageScheme of scheme.messages) convertFieldsCase(messageScheme);
};
