#!/usr/bin/env node

"use strict";

const path = require("path");
const { execFile } = require("child_process");
const find = require("find");
const slash = require("slash");
const findNodeModules = require("find-node-modules");

const exeExt = process.platform === "win32" ? ".exe" : "";
const packageDirectory = path.join(findNodeModules({ relative: false })[0], "grpc-tools");

const protocPath = find.fileSync(new RegExp(`protoc${exeExt}$`), packageDirectory)[0];
const pluginPath = find.fileSync(new RegExp(`grpc_node_plugin${exeExt}$`), packageDirectory)[0];

const includePath = path.resolve(__dirname, "..", "include");
const includedProtos = find.fileSync(/\.proto$/, includePath).map(x => slash(path.relative(includePath, path.normalize(x))));
const args = ["--plugin=protoc-gen-grpc=" + pluginPath, "-I", includePath].concat(process.argv.slice(2)).concat(includedProtos);
const child_process = execFile(protocPath, args, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);
