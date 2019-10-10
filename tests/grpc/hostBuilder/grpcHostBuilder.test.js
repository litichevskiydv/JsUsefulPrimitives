const path = require("path");
const grpc = require("grpc");
const GRPCError = require("grpc-error");
const protoLoader = require("@grpc/proto-loader");
const GrpcHostBuilder = require("../../../src/grpc/hostBuilder");
const asyncContext = require("../../../src/async-context");
const { HelloRequest: ServerRequest, HelloResponse: ServerResponse } = require("../../../src/grpc/generated/server/greeter_pb").v1;
const {
  HelloRequest: ClientRequest,
  HelloResponse: ClientResponse,
  GreeterClient
} = require("../../../src/grpc/generated/client/greeter_client_pb").v1;

expect.extend({
  containsError(received) {
    if (Object.values(received).find(x => x instanceof Error)) return { pass: true };
    return {
      pass: false,
      message: () => `expected ${received} contains error`
    };
  }
});

const grpcBind = "0.0.0.0:3000";
const packageObject = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, "../../../src/grpc/protos/greeter.proto"), {
    includeDirs: [
      path.join(__dirname, "../../../src/grpc/complier/include/"),
      path.join(__dirname, "../../../node_modules/grpc-tools/bin/")
    ]
  })
);

/**
 * Creates and starts gRPC server
 * @param {function(GrpcHostBuilder):GrpcHostBuilder} configurator Server builder configurator
 */
const createHost = configurator => {
  return configurator(new GrpcHostBuilder())
    .addService(packageObject.v1.Greeter.service, {
      sayHello: call => {
        const request = new ServerRequest(call.request);
        return new ServerResponse({
          traceId: asyncContext.default.get("traceId"),
          message: `Hello, ${request.name}!`
        });
      }
    })
    .bind(grpcBind)
    .build();
};

const getMessage = async name => {
  const request = new ClientRequest();
  request.setName(name);

  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure());
  const message = (await client.sayHello(request)).getMessage();
  client.close();

  return message;
};

const getTraceId = async callerTraceId => {
  const metadata = new grpc.Metadata();
  if (callerTraceId) metadata.set("trace_id", callerTraceId);
  const request = new ServerRequest({ name: "Tester" });

  const client = new packageObject.v1.Greeter(grpcBind, grpc.credentials.createInsecure());
  const traceId = (await new Promise((resolve, reject) => {
    client.sayHello(request, metadata, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  })).traceId;
  client.close();

  return traceId;
};

test("Must build simple server", async () => {
  // Given
  const server = createHost(x => x);

  // When
  const actualMessage = await getMessage("Tom");
  server.forceShutdown();

  // Then
  expect(actualMessage).toBe("Hello, Tom!");
});

test("Must build server with stateless interceptors", async () => {
  // Given
  const server = createHost(x =>
    x
      .addInterceptor(async (call, methodDefinition, callback, next) => {
        if (call.request.name === "Tom") callback(null, { message: "Hello again, Tom!" });
        else await next(call, callback);
      })
      .addInterceptor(async (call, methodDefinition, callback, next) => {
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

class InterceptorForTom {
  async invoke(call, methodDefinition, callback, next) {
    if (call.request.name === "Tom") callback(null, { message: "Hello again, Tom!" });
    else await next(call, callback);
  }
}

test("Must build server with stateful interceptor", async () => {
  // Given
  const server = createHost(x => x.addInterceptor(InterceptorForTom));

  // When
  const messageForTom = await getMessage("Tom");
  const messageForAlex = await getMessage("Alex");
  server.forceShutdown();

  // Then
  expect(messageForTom).toBe("Hello again, Tom!");
  expect(messageForAlex).toBe("Hello, Alex!");
});

test("Must catch and log common error", async () => {
  // Given
  const mockLogger = { error: jest.fn() };
  const mockLoggersFactory = () => mockLogger;

  const server = createHost(x =>
    x
      .addInterceptor(() => {
        throw new Error("Something went wrong");
      })
      .useLoggersFactory(mockLoggersFactory)
  );

  // When, Then
  await expect(getMessage("Tom")).rejects.toEqual(new Error("13 INTERNAL: Something went wrong"));
  expect(mockLogger.error).toHaveBeenCalledWith(expect.any(String), expect.containsError());

  server.forceShutdown();
});

test("Must catch and not log GRPCError", async () => {
  // Given
  const mockLogger = { error: jest.fn() };
  const mockLoggersFactory = () => mockLogger;

  const server = createHost(x =>
    x
      .addInterceptor(() => {
        throw new GRPCError("Wrong payload", grpc.status.INVALID_ARGUMENT, null);
      })
      .useLoggersFactory(mockLoggersFactory)
  );

  // When, Then
  await expect(getMessage("Tom")).rejects.toEqual(new Error("3 INVALID_ARGUMENT: Wrong payload"));
  expect(mockLogger.error).toBeCalledTimes(0);

  server.forceShutdown();
});

test("Must handle error with non ASCII message", async () => {
  // Given
  const mockLogger = { error: jest.fn() };
  const mockLoggersFactory = () => mockLogger;

  const server = createHost(x =>
    x
      .addInterceptor(() => {
        throw new Error("Что-то пошло не так");
      })
      .useLoggersFactory(mockLoggersFactory)
  );

  // When, Then
  await expect(getMessage("Tom")).rejects.toEqual(new Error("13 INTERNAL: Что-то пошло не так"));
  expect(mockLogger.error).toBeCalledTimes(1);

  server.forceShutdown();
});

test("Must throw error if server method was not implemented", () => {
  // Given
  const builder = new GrpcHostBuilder().addService(packageObject.v1.Greeter.service, {});

  // When, Then
  expect(() => builder.build()).toThrowWithMessage(Error, "Method /v1.Greeter/SayHello is not implemented");
});

test("Must return new trace id if source was not supplied", async () => {
  // Given
  const expectedTraceId = "test_trace_id";
  const server = createHost(x => x.useTracesIdsGenerator(() => expectedTraceId));

  // When
  const actualTraceId = await getTraceId();

  // When, Then
  expect(actualTraceId).toBe(expectedTraceId);

  server.forceShutdown();
});

test("Must return source trace id", async () => {
  // Given
  const newTraceId = "new_trace_id";
  const expectedTraceId = "test_trace_id";
  const server = createHost(x => x.useTracesIdsGenerator(() => newTraceId));

  // When
  const actualTraceId = await getTraceId(expectedTraceId);

  // When, Then
  expect(actualTraceId).toBe(expectedTraceId);

  server.forceShutdown();
});
