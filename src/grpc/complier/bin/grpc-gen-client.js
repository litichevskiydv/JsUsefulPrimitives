#!/usr/bin/env node

"use strict";

const path = require("path");
const makeDir = require("make-dir");
const pathKey = require("path-key");
const { execFile } = require("child_process");

/**
 * @param {CommandLineArguments} argv
 */
const createOutputDirectory = async argv => await makeDir(argv.out);

/**
 * @param {CommandLineArguments} argv
 * @param {*} env
 */
const generateClient = (argv, env) => {
  const args = [
    `--client${process.platform === "win32" ? ".cmd" : ""}_out`,
    argv.out,
    "-I",
    path.resolve(__dirname, "..", "include"),
    ...(argv.include || []).reduce((acc, cur) => acc.concat("-I", cur), []),
    argv.protoFile
  ];
  const child_process = execFile(`protoc${process.platform === "win32" ? ".exe" : ""}`, args, { env }, error => {
    if (error) throw error;
  });

  child_process.stdout.pipe(process.stdout);
  child_process.stderr.pipe(process.stderr);
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
  generateClient(argv, env);
})();

/**
 * @typedef {Object} CommandLineArguments
 * @property {string} include
 * @property {string} out
 * @property {string} protoFile
 */
