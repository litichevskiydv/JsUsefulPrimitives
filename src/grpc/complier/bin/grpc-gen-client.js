#!/usr/bin/env node

"use strict";

const path = require("path");
const pathKey = require("path-key");
const { execFile } = require("child_process");

const env = { ...process.env };
const pathKeyName = pathKey({ env });
env[pathKeyName] = process.mainModule.paths
  .map(x => path.join(x, "grpc-tools", "bin"))
  .concat(process.mainModule.paths.map(x => path.join(x, ".bin")))
  .concat(env[pathKeyName])
  .join(path.delimiter);

const exeExt = process.platform === "win32" ? ".exe" : "";
const scriptExt = process.platform === "win32" ? ".cmd" : "";

const args = ["-I", path.resolve(__dirname, "..", "include")].concat(
  process.argv.slice(2).map(x => (x.startsWith("--client_out") ? x.replace("--client_out", `--client${scriptExt}_out`) : x))
);
const child_process = execFile(`protoc${exeExt}`, args, { env }, error => {
  if (error) throw error;
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);