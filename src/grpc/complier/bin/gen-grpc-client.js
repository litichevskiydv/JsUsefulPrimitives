#!/usr/bin/env node

"use strict";

const path = require("path");
const find = require("find");
const findNodeModules = require("find-node-modules");
const npmRunPath = require("npm-run-path");
const { execFile } = require("child_process");

const exeExt = process.platform === "win32" ? ".exe" : "";
const scriptExt = process.platform === "win32" ? ".cmd" : "";
const modulesDirectory = findNodeModules({ relative: false })[0];

const protocPath = find.fileSync(new RegExp(`protoc${exeExt}$`), path.join(modulesDirectory, "grpc-tools"))[0];
const args = ["-I", path.resolve(__dirname, "..", "include")].concat(
  process.argv.slice(2).map(x => (x.startsWith("--client_out") ? x.replace("--client_out", `--client${scriptExt}_out`) : x))
);
const child_process = execFile(protocPath, args, { env: npmRunPath.env() }, error => {
  if (error) throw error;
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);
