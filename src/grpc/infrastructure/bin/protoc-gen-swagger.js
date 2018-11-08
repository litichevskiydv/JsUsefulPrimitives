#!/usr/bin/env node

"use strict";

const path = require("path");
const findNodeModules = require("find-node-modules");
const find = require("find");
const execFile = require("child_process").execFile;

const exeExt = process.platform === "win32" ? ".exe" : "";
const modulesDirectory = findNodeModules({ relative: false })[0];

const protocPath = find.fileSync(new RegExp(`protoc${exeExt}$`), path.join(modulesDirectory, "grpc-tools"))[0];
const pluginPath = path.resolve(__dirname, "protoc-gen-swagger" + exeExt);

const args = ["--plugin=protoc-gen-swagger=" + pluginPath, "-I", path.resolve(__dirname, "..", "include")].concat(process.argv.slice(2));
const child_process = execFile(protocPath, args, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);
