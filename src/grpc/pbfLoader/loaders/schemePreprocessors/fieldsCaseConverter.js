const camelCase = require("camelcase");

function convertFieldsCase(scheme) {
  if (scheme.fields) for (const fieldScheme of scheme.fields) fieldScheme.name = camelCase(fieldScheme.name);
  if (scheme.messages) for (const messageScheme of scheme.messages) convertFieldsCase(messageScheme);
}

module.exports = convertFieldsCase;
