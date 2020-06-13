const schemeLoader = require("./loaders/schemeLoader");
const packageDefinitionLoader = require("./loaders/packageDefinitionLoader");

module.exports = {
  scheme: schemeLoader,
  packageDefinition: packageDefinitionLoader,
};
