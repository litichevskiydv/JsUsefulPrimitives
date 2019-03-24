const bl = require("bl");
const path = require("path");
const { CodeGeneratorRequest, CodeGeneratorResponse } = require("google-protobuf/google/protobuf/compiler/plugin_pb");

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
  const filesToGenerate = new Set(request.getFileToGenerateList());
  request.getProtoFileList().forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    if (filesToGenerate.has(fileName) === false || fileDescriptor.getServiceList().length === 0) return;

    const clientFile = new CodeGeneratorResponse.File();
    clientFile.setName(path.join(path.dirname(fileName), `${path.basename(fileName, path.extname(fileName))}_pb_client.js`));
    clientFile.setContent("test");
    response.addFile(clientFile);

    const clientTypesFile = new CodeGeneratorResponse.File();
    clientTypesFile.setName(path.join(path.dirname(fileName), `${path.basename(fileName, path.extname(fileName))}_pb_client.d.ts`));
    clientTypesFile.setContent("test");
    response.addFile(clientTypesFile);
  });

  process.stdout.write(new Buffer(response.serializeBinary()));
})();
