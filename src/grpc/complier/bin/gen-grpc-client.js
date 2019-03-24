#!/usr/bin/env node

"use strict";

const path = require("path");
const { execFile } = require("child_process");
const find = require("find");
const slash = require("slash");
const findNodeModules = require("find-node-modules");

const exeExt = process.platform === "win32" ? ".exe" : "";
const scriptExt = process.platform === "win32" ? ".cmd" : "";
const modulesDirectory = findNodeModules({ relative: false })[0];

const protocPath = find.fileSync(new RegExp(`protoc${exeExt}$`), path.join(modulesDirectory, "grpc-tools"))[0];
const pluginPath = find.fileSync(new RegExp(`protoc-gen-client${scriptExt}$`), path.join(process.env.APPDATA, "npm"))[0];

const args = ["--plugin=protoc-gen-client=" + pluginPath, "-I", path.resolve(__dirname, "..", "include")].concat(process.argv.slice(2));
const child_process = execFile(protocPath, args, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);
