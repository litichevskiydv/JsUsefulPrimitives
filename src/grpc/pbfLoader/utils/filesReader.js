const path = require("path");
const fs = require("fs-extra");

/**
 * @param {string} protoFilePath
 * @param {string[]} includeDirs
 * @returns {Promise<Buffer>}
 */
const read = async (protoFilePath, includeDirs) => {
  if (path.isAbsolute(protoFilePath)) return fs.readFile(protoFilePath);

  for (const includeDir of includeDirs) {
    const fullPath = path.join(includeDir, protoFilePath);
    if ((await fs.pathExists(fullPath)) === false) continue;

    return fs.readFile(fullPath);
  }

  throw new Error(`File ${protoFilePath} does not exist`);
};

/**
 * @param {string} protoFilePath
 * @param {string[]} includeDirs
 * @returns {Buffer}
 */
const readSync = (protoFilePath, includeDirs) => {
  if (path.isAbsolute(protoFilePath)) return fs.readFileSync(protoFilePath);

  for (const includeDir of includeDirs) {
    const fullPath = path.join(includeDir, protoFilePath);
    if (fs.pathExistsSync(fullPath) === false) continue;

    return fs.readFileSync(fullPath);
  }

  throw new Error(`File ${protoFilePath} does not exist`);
};

module.exports = {
  read,
  readSync
};
