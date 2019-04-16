#!/usr/bin/env node

"use strict";

const path = require("path");
const pathKey = require("path-key");
const { execFileSync } = require("child_process");

const env = { ...process.env };
const pathKeyName = pathKey({ env });
env[pathKeyName] = process.mainModule.paths
  .map(x => path.join(x, ".bin"))
  .concat(env[pathKeyName])
  .join(path.delimiter);

const args = ["-I", path.join(__dirname, "..", "include")].concat(process.argv.slice(2));
execFileSync(`grpc_tools_node_protoc${process.platform === "win32" ? ".cmd" : ""}`, args, { env });
