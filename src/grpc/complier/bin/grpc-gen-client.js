#!/usr/bin/env node

"use strict";

const path = require("path");
const delPath = require("del");
const makeDir = require("make-dir");
const pathKey = require("path-key");
const loadFile = require("load-json-file");
const { execFileSync } = require("child_process");

/**
 * @param {CommandLineArguments} argv
 */
const createOutputDirectory = async argv => await makeDir(argv.out);

/**
 * @param {string} name
 * @returns {string}
 */
const prepareScriptName = name => `${name}${process.platform === "win32" ? ".cmd" : ""}`;

/**
 * @param {string} pluginName
 * @param {string} outputDirectory
 * @returns {string}
 */
const preparePluginOptions = (pluginName, outputDirectory) => `--${prepareScriptName(pluginName)}_out=${outputDirectory}`;

/**
 * @param {string[]} includes
 * @param {boolean} addDefaultIncludes
 * @returns {string[]}
 */
const prepareIncludes = (includes, addDefaultIncludes) =>
  (includes || [])
    .concat(addDefaultIncludes ? [path.join(__dirname, "..", "include")] : [])
    .reduce((acc, cur) => acc.concat("-I", cur), []);

/**
 * @returns {string}
 */
const prepareProtocName = () => `protoc${process.platform === "win32" ? ".exe" : ""}`;

/**
 * @param {CommandLineArguments} argv
 * @param {*} env
 * @returns {Promise<string[]>}
 */
const getFilesList = async (argv, env) => {
  const args = [preparePluginOptions("files", argv.out), ...prepareIncludes(argv.include, true), argv.protoFile];
  execFileSync(prepareProtocName(), args, { env });

  const filesListPath = path.join(argv.out, "files-list.json");
  const filesList = await loadFile(filesListPath);
  delPath(filesListPath, { force: true });

  return filesList;
};

/**
 * @param {CommandLineArguments} argv
 * @param {*} env
 * @param {string[]} filesList
 */
const generateJs = (argv, env, filesList) => {
  const args = [
    `--js_out=import_style=commonjs,binary:${argv.out}`,
    `--grpc_out=${argv.out}`,
    ...prepareIncludes(argv.include),
    ...filesList
  ];
  execFileSync(prepareScriptName("grpc-gen-js"), args, { env });
};

/**
 * @param {CommandLineArguments} argv
 * @param {*} env
 * @param {string[]} filesList
 */
const generateTs = (argv, env, filesList) => {
  const args = [`--ts_out=${argv.out}`, ...prepareIncludes(argv.include), ...filesList];
  execFileSync(prepareScriptName("grpc-gen-ts"), args, { env });
};

/**
 * @param {CommandLineArguments} argv
 * @param {*} env
 */
const generateClient = (argv, env) => {
  const args = [preparePluginOptions("client", argv.out), ...prepareIncludes(argv.include, true), argv.protoFile];
  execFileSync(prepareProtocName(), args, { env });
};

(async () => {
  const argv = require("yargs")
    .usage("$0 [options] <protoFile>", "Produces clients for all services from given proto file")
    .option("i", {
      alias: "include",
      type: "string",
      array: true,
      nargs: 1,
      description: "Include directory"
    })
    .option("o", {
      alias: "out",
      type: "string",
      default: process.cwd(),
      description: "Output directory"
    }).argv;

  const env = { ...process.env };
  const pathKeyName = pathKey({ env });
  env[pathKeyName] = process.mainModule.paths
    .map(x => path.join(x, "grpc-tools", "bin"))
    .concat(process.mainModule.paths.map(x => path.join(x, ".bin")))
    .concat(env[pathKeyName])
    .join(path.delimiter);

  await createOutputDirectory(argv);
  const filesList = await getFilesList(argv, env);
  generateJs(argv, env, filesList);
  generateTs(argv, env, filesList);
  generateClient(argv, env);
})();

/**
 * @typedef {Object} CommandLineArguments
 * @property {string[]} include
 * @property {string} out
 * @property {string} protoFile
 */
