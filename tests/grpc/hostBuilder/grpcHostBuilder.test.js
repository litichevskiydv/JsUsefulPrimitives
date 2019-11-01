const path = require("path");
const grpc = require("grpc");
const GRPCError = require("grpc-error");
const protoLoader = require("@grpc/proto-loader");
const { GrpcHostBuilder } = require("../../../src/grpc/hostBuilder");
const serverInterceptor = require("../../../src/grpc/tracing/opentracing/serverInterceptor");
const clientInterceptor = require("../../../src/grpc/tracing/opentracing/clientInterceptor");
const { from, Observable, Subject } = require("rxjs");
const { map, reduce } = require("rxjs/operators");

const {
  HelloRequest: ServerUnaryRequest,
  HelloResponse: ServerUnaryResponse,
  SumResponse: ServerIngoingStreamingResponse,
  RangeRequest: ServerOutgoingStreamingRequest,
  RangeResponse: ServerOutgoingStreamingResponse,
  SelectResponse: ServerBidiStreamingResponse
} = require("../../../src/grpc/generated/server/greeter_pb").v1;
const {
  HelloRequest: ClientUnaryRequest,
  SumRequest: ClientOutgoingStreamingRequest,
  RangeRequest: ClientIngoingStreamingRequest,
  SelectRequest: ClientBidiStreamingRequest,
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
    .addInterceptor(serverInterceptor)
    .addService(packageObject.v1.Greeter.service, {
      sayHello: call => {
        const request = new ServerUnaryRequest(call.request);
        return new ServerUnaryResponse({
          spanId: call.metadata.get("span_id")[0],
          message: `Hello, ${request.name}!`
        });
      },
      sum: call =>
        call.source.pipe(
          reduce((acc, one) => {
            acc.result = acc.result + one.number;
            return acc;
          }, new ServerIngoingStreamingResponse({ result: 0 }))
        ),
      range: call => {
        const request = new ServerOutgoingStreamingRequest(call.request);
        return new Observable(subscriber => {
          for (let i = request.from; i <= request.to; i++) subscriber.next(new ServerOutgoingStreamingResponse({ result: i }));
          subscriber.complete();
        });
      },
      select: call => call.source.pipe(map(x => new ServerBidiStreamingResponse({ value: x.value + 1 })))
    })
    .bind(grpcBind)
    .build();
};

const getMessage = async name => {
  const request = new ClientUnaryRequest();
  request.setName(name);

  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure(), { interceptors: [clientInterceptor] });
  const message = (await client.sayHello(request)).getMessage();
  client.close();

  return message;
};

const getSpanId = async callerSpanId => {
  const metadata = new grpc.Metadata();
  if (callerSpanId) metadata.set("span_id", callerSpanId);

  const request = new ClientUnaryRequest();
  request.setName("Tester");

  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure(), { interceptors: [clientInterceptor] });
  const spanId = (await client.sayHello(request, metadata)).getSpanId();
  client.close();

  return spanId;
};

test("Must perform unary call", async () => {
  // Given
  const server = createHost(x => x);

  // When
  const actualMessage = await getMessage("Tom");
  server.forceShutdown();

  // Then
  expect(actualMessage).toBe("Hello, Tom!");
});

test("Must perform client streaming call", async () => {
  // Given
  const server = createHost(x => x);
  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure());
  const numbers = [1, 2, 3, 4, 5, 6, 7];

  // When
  const actualSum = (await client.sum(
    from(
      numbers.map(x => {
        const request = new ClientOutgoingStreamingRequest();
        request.setNumber(x);
        return request;
      })
    )
  )).getResult();
  client.close();
  server.forceShutdown();

  // Then
  const expectedSum = numbers.reduce((acc, one) => acc + one, 0);
  expect(actualSum).toBe(expectedSum);
});

test("Must perform server streaming call", async () => {
  // Given
  const server = createHost(x => x);
  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure());

  // When
  const rangeRequest = new ClientIngoingStreamingRequest();
  rangeRequest.setFrom(1);
  rangeRequest.setTo(3);

  const actualNumbers = [];
  await client.range(rangeRequest).forEach(x => actualNumbers.push(x.getResult()));

  client.close();
  server.forceShutdown();

  // Then
  const expectedNumbers = [1, 2, 3];
  expect(actualNumbers).toEqual(expectedNumbers);
});

test("Must perform bidirectional streaming call", async () => {
  // Given
  const server = createHost(x => x);
  const client = new GreeterClient(grpcBind, grpc.credentials.createInsecure());

  // When
  const actualNumbers = [];
  const input = new Subject();
  const output = client.select(input);
  output.subscribe(message => {
    actualNumbers.push(message.getValue());

    if (message <= 5) {
      const request = new ClientBidiStreamingRequest();
      request.setValue(message.getValue() + 1);

      input.next(request);
    } else input.complete();
  });

  const firstRequest = new ClientBidiStreamingRequest();
  firstRequest.setValue(1);
  input.next(firstRequest);

  await output.toPromise();
  client.close();
  server.forceShutdown();

  // Then
  const expectedNumbers = [2, 4, 6];
  expect(actualNumbers).toEqual(expectedNumbers);
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

test("Must transfer value through metadata", async () => {
  // Given
  const expectedSpanId = "test_span_id";
  const server = createHost(x => x);

  // When
  const actualSpanId = await getSpanId(expectedSpanId);

  // Then
  expect(actualSpanId).toBe(expectedSpanId);

  server.forceShutdown();
});
