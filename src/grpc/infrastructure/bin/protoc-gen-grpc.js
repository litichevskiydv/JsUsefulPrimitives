"use strict";

const path = require("path");
const findNodeModules = require("find-node-modules");
const find = require("find");
const execFile = require("child_process").execFile;

const exeExt = process.platform === "win32" ? ".exe" : "";
const packageDirectory = path.join(findNodeModules({ relative: false })[0], "grpc-tools");

const protocPath = find.fileSync(new RegExp(`protoc${exeExt}$`), packageDirectory)[0];
const pluginPath = find.fileSync(new RegExp(`grpc_node_plugin${exeExt}$`), packageDirectory)[0];

const args = ["--plugin=protoc-gen-grpc=" + pluginPath, "-I", path.resolve(__dirname, "..", "include")].concat(process.argv.slice(2));
const child_process = execFile(protocPath, args, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);
