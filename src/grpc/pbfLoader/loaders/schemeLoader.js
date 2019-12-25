const path = require("path");
const { set } = require("dot-prop");
const protobufSchema = require("protocol-buffers-schema");

const filesReader = require("../utils/filesReader");
const schemePreprocessors = require("./schemePreprocessors");

/**
 * @param {any} packagesStructure
 * @param {string} rootPackageName
 * @param {string} protofileName
 * @param {Buffer} protoFileContent
 */
function processFile(packagesStructure, rootPackageName, protofileName, protoFileContent) {
  const protoFileScheme = protobufSchema.parse(protoFileContent);

  const packageName = protoFileScheme.package;
  const fileBaseName = path.basename(protofileName, path.extname(protofileName));
  const namespaceName =
    rootPackageName === undefined || !packageName || packageName === rootPackageName ? fileBaseName : `${packageName}.${fileBaseName}`;
  set(packagesStructure, namespaceName, protoFileScheme);

  return protoFileScheme;
}

/**
 * @param {string} parentKey
 * @param {any} structure
 */
function collectMessagesAndEnums(parentKey, structure) {
  const scheme = { enums: [], messages: [] };
  if (parentKey) Object.assign(scheme, { name: parentKey, fields: [] });

  for (const [key, childStructure] of Object.entries(structure))
    if (childStructure.enums || childStructure.messages) {
      scheme.enums.push(...childStructure.enums);
      scheme.messages.push(...childStructure.messages);
    } else scheme.messages.push(collectMessagesAndEnums(key, childStructure));

  return scheme;
}

/**
 * @param {DefinitionLoadingOptions} options
 */
function prepareOptions(options) {
  /**  @type {DefinitionLoadingOptions} */
  const opts = options || {};
  opts.includeDirs = (opts.includeDirs || []).concat([path.join(__dirname, "../include/")]);

  return opts;
}

/**
 * @param {string} protoFilePath
 * @param {DefinitionLoadingOptions} [options]
 */
async function load(protoFilePath, options) {
  let rootFileScheme = {};
  const opts = prepareOptions(options);

  const packagesStructure = {};
  const processedPaths = new Set();
  const pathsForProcessing = [protoFilePath];
  while (pathsForProcessing.length > 0) {
    const pathForProcessing = pathsForProcessing.shift();
    if (processedPaths.has(pathForProcessing)) continue;

    const fileContent = await filesReader.read(pathForProcessing, opts.includeDirs);
    const fileScheme = processFile(packagesStructure, rootFileScheme.package, pathForProcessing, fileContent);
    if (pathForProcessing === protoFilePath) rootFileScheme = fileScheme;

    pathsForProcessing.push(...fileScheme.imports);
    processedPaths.add(pathForProcessing);
  }

  Object.assign(rootFileScheme, collectMessagesAndEnums(null, packagesStructure));
  if (!opts.keepCase) schemePreprocessors.convertFieldsCase(rootFileScheme);
  return rootFileScheme;
}

/**
 * @param {string} protoFilePath
 * @param {DefinitionLoadingOptions} [options]
 */
function loadSync(protoFilePath, options) {
  let rootFileScheme = {};
  const opts = prepareOptions(options);

  const packagesStructure = {};
  const processedPaths = new Set();
  const pathsForProcessing = [protoFilePath];
  while (pathsForProcessing.length > 0) {
    const pathForProcessing = pathsForProcessing.shift();
    if (processedPaths.has(pathForProcessing)) continue;

    const fileContent = filesReader.readSync(pathForProcessing, opts.includeDirs);
    const fileScheme = processFile(packagesStructure, rootFileScheme.package, pathForProcessing, fileContent);
    if (pathForProcessing === protoFilePath) rootFileScheme = fileScheme;

    pathsForProcessing.push(...fileScheme.imports);
    processedPaths.add(pathForProcessing);
  }

  Object.assign(rootFileScheme, collectMessagesAndEnums(null, packagesStructure));
  if (!opts.keepCase) schemePreprocessors.convertFieldsCase(rootFileScheme);
  return rootFileScheme;
}

module.exports = {
  load,
  loadSync
};

/**
 * @typedef {Object} DefinitionLoadingOptions
 * @property {boolean} keepCase Preserve field names. The default is to change them to camel case.
 * @property {string[]} includeDirs Paths to search for imported `.proto` files.
 */
