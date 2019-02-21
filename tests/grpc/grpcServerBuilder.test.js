const path = require("path");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const GrpcServerBuilder = require("../../src/grpc/grpcServerBuilder");
const { HelloRequest, HelloResponse } = require("../../src/grpc/generated/greeter_pb").v1;

const grpcBind = "0.0.0.0:3000";
const packageObject = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, "../../src/grpc/protos/greeter.proto"), {
    includeDirs: [path.join(__dirname, "../../src/grpc/complier/include/"), path.join(__dirname, "../../node_modules/grpc-tools/bin/")]
  })
);

/**
 * Creates and starts gRPC server
 * @param {function(GrpcServerBuilder):GrpcServerBuilder} configurator Server builder configurator
 */
const createServer = configurator => {
  return configurator(new GrpcServerBuilder())
    .addService(packageObject.v1.Greeter.service, {
      sayHello: (call, callback) => {
        const request = new HelloRequest(call.request);
        callback(null, new HelloResponse({ message: `Hello, ${request.name}!` }));
      }
    })
    .bind(grpcBind)
    .build();
};

const getMessage = async name => {
  const client = new packageObject.v1.Greeter(grpcBind, grpc.credentials.createInsecure());
  return await new Promise((resolve, reject) => {
    client.sayHello(new HelloRequest({ name: name }), (error, response) => {
      if (error) reject(error);
      else resolve(response.message);
    });
  });
};

test("Must build simple server", async () => {
  // Given
  const server = createServer(x => x);

  // When
  const actualMessage = await getMessage("Tom");
  server.forceShutdown();

  // Then
  expect(actualMessage).toBe("Hello, Tom!");
});

test("Must build server with interceptors", async () => {
  // Given
  const server = createServer(x =>
    x
      .useInterceptor(async (call, methodDefinition, callback, next) => {
        if (call.request.name === "Tom") callback(null, { message: "Hello again, Tom!" });
        else await next(call, callback);
      })
      .useInterceptor(async (call, methodDefinition, callback, next) => {
        if (call.request.name === "Jane") callback(null, { message: "Hello dear, Jane!" });
        else await next(call, callback);
      })
  );

  // When
  const messageForTom = await getMessage("Tom");
  const messageForJane = await getMessage("Jane");
  const messageForAlex = await getMessage("Alex");
  server.forceShutdown();

  // Then
  expect(messageForTom).toBe("Hello again, Tom!");
  expect(messageForJane).toBe("Hello dear, Jane!");
  expect(messageForAlex).toBe("Hello, Alex!");
});