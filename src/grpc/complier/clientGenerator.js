const bl = require("bl");
const path = require("path");
const { CodeGeneratorRequest, CodeGeneratorResponse } = require("google-protobuf/google/protobuf/compiler/plugin_pb");

/**
 * Adds new file to code generation response
 * @param {CodeGeneratorResponse} response Code generation response
 * @param {string} originalFileName Name of the original file
 * @param {string} fileExtension Extension of the new file
 * @param {string} content New file content
 */
const addFileToResponse = (response, originalFileName, fileExtension, content) => {
  const file = new CodeGeneratorResponse.File();
  file.setName(
    path.join(
      path.dirname(originalFileName),
      `${path.basename(originalFileName, path.extname(originalFileName))}_pb_client.${fileExtension}`
    )
  );
  file.setContent(content);
  response.addFile(file);
};

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

    addFileToResponse(response, fileName, "js", "test");
    addFileToResponse(response, fileName, "d.ts", "test");
  });

  process.stdout.write(Buffer.from(response.serializeBinary()));
})();
