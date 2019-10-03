const path = require("path");
const slash = require("slash");
const camelCase = require("camelcase");

const standardRequires = require("../standardRequires");

/**
 * Generates namespace import path
 * @param {string} importPath Import path from proto file
 */
const getNamespace = importPath =>
  camelCase(
    slash(importPath)
      .replace(path.extname(importPath), "")
      .split(new RegExp(`[-${path.posix.sep}]+`))
      .join("_")
  );

/**
 * @param {string} importPath
 * @param {string} [suffix = "pb"]
 */
const importPathToRequirePath = (importPath, suffix) =>
  `./${importPath.replace(path.extname(importPath), "")}_${suffix || "pb"}`;

/**
 * Generates require path
 * @param {string} importPath Import path from proto file
 * @param {string} [suffix = "pb"] Require path suffix
 */
const getRequirePath = (importPath, suffix) =>
  standardRequires.get(slash(importPath)) || importPathToRequirePath(importPath, suffix);

module.exports = {
  getNamespace,
  getRequirePath
};
