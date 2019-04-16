#!/usr/bin/env node

const bl = require("bl");
const slash = require("slash");
const { CodeGeneratorRequest, CodeGeneratorResponse } = require("google-protobuf/google/protobuf/compiler/plugin_pb");

const standardRequires = require("../standardRequires");

(async () => {
  const request = CodeGeneratorRequest.deserializeBinary(
    new Uint8Array(
      await new Promise((resolve, reject) => {
        process.stdin.pipe(
          bl((error, data) => {
            if (error) reject(error);
            else resolve(data);
          })
        );
      })
    )
  );

  const response = new CodeGeneratorResponse();

  const file = new CodeGeneratorResponse.File();
  file.setName("files-list.json");
  file.setContent(
    JSON.stringify(
      request
        .getProtoFileList()
        .filter(x => standardRequires.has(slash(x.getName())) === false)
        .map(x => slash(x.getName()))
    )
  );
  response.addFile(file);

  process.stdout.write(Buffer.from(response.serializeBinary()));
})();
