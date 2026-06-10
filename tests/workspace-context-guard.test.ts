import { describe, expect, it } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createWorkspaceContextGuardHook,
  type WorkspaceMembershipResolver,
  type WorkspaceMembershipResolverInput
} from "../src/workspace-context-guard.js";
import { WORKSPACE_ID_HEADER } from "../src/request-context.js";
import type {
  FullyResolvedRequestContext,
  VerifiedIdentityContext
} from "../src/request-context.js";

const TEST_ACTOR_ID = "auth0|actor-1";
const TEST_WORKSPACE_ID = "workspace-1";
const ROUTE_WORKSPACE_ID = "workspace-route";

type TestRequest = FastifyRequest & {
  verifiedIdentityContext?: VerifiedIdentityContext;
  requestContext?: FullyResolvedRequestContext;
  correlationId?: string;
  body?: unknown;
  query?: unknown;
};

interface TestReply {
  statusCode: number;
  payload: unknown;
  code: (statusCode: number) => TestReply;
  send: (payload: unknown) => TestReply;
}

interface GuardInput {
  params?: unknown;
  verifiedIdentityContext?: unknown;
  headers?: Record<string, string>;
  body?: unknown;
  query?: unknown;
  resolver?: WorkspaceMembershipResolver;
}

function createReply(): TestReply {
  const reply: TestReply = {
    statusCode: 200,
    payload: undefined,
    code(statusCode: number) {
      reply.statusCode = statusCode;
      return reply;
    },
    send(payload: unknown) {
      reply.payload = payload;
      return reply;
    }
  };

  return reply;
}

function createRequest(input: GuardInput): TestRequest {
  return {
    params: input.params,
    verifiedIdentityContext: input.verifiedIdentityContext as
      | VerifiedIdentityContext
      | undefined,
    headers: input.headers ?? {},
    body: input.body,
    query: input.query,
    correlationId: "test-correlation-id"
  } as TestRequest;
}

async function runGuard(input: GuardInput) {
  const request = createRequest(input);
  const reply = createReply();

  const guard = createWorkspaceContextGuardHook({
    resolveMembership: input.resolver ?? (() => ({ outcome: "member" }))
  });

  await guard(request as FastifyRequest, reply as unknown as FastifyReply);

  return { request, reply };
}

function verifiedIdentity(actorId = TEST_ACTOR_ID): VerifiedIdentityContext {
  return { actorId };
}

function validWorkspaceParams(workspaceId = TEST_WORKSPACE_ID) {
  return { workspaceId };
}

async function expectGuardError(
  input: GuardInput,
  statusCode: number,
  code: string
): Promise<void> {
  const { reply } = await runGuard(input);

  expect(reply.statusCode).toBe(statusCode);
  expect(reply.payload).toMatchObject({ code });
}

async function expectResolvedContext(
  input: GuardInput,
  expected: FullyResolvedRequestContext
): Promise<TestRequest> {
  const { request, reply } = await runGuard(input);

  expect(reply.statusCode).toBe(200);
  expect(reply.payload).toBeUndefined();
  expect(request.requestContext).toEqual(expected);

  return request;
}

describe("workspaceContextGuard — identity boundary", () => {
  it.each([
    ["missing", undefined],
    ["null", null],
    ["blank actorId", { actorId: "   " }]
  ])(
    "returns 401 when VerifiedIdentityContext is %s",
    async (_caseName, identity) => {
      await expectGuardError(
        {
          verifiedIdentityContext: identity,
          params: validWorkspaceParams()
        },
        401,
        "VERIFIED_IDENTITY_REQUIRED"
      );
    }
  );

  it("does not require live Auth0 when VerifiedIdentityContext fixture exists", async () => {
    await expectResolvedContext(
      {
        verifiedIdentityContext: verifiedIdentity(),
        params: validWorkspaceParams()
      },
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: TEST_WORKSPACE_ID
      }
    );
  });
});

describe("workspaceContextGuard — workspaceId route parameter boundary", () => {
  it.each([
    ["missing", {}, "WORKSPACE_ID_REQUIRED"],
    ["invalid", { workspaceId: "bad workspace id" }, "INVALID_WORKSPACE_ID"]
  ])(
    "returns 400 when workspaceId route parameter is %s",
    async (_caseName, params, code) => {
      await expectGuardError(
        {
          verifiedIdentityContext: verifiedIdentity(),
          params
        },
        400,
        code
      );
    }
  );

  it("uses the route/path workspaceId as the only trusted workspace source", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];

    const resolver: WorkspaceMembershipResolver = (input) => {
      calls.push(input);
      return { outcome: "member" };
    };

    await expectResolvedContext(
      {
        verifiedIdentityContext: verifiedIdentity(),
        params: validWorkspaceParams(ROUTE_WORKSPACE_ID),
        headers: { [WORKSPACE_ID_HEADER]: "workspace-header" },
        body: { workspaceId: "workspace-body" },
        query: { workspaceId: "workspace-query" },
        resolver
      },
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: ROUTE_WORKSPACE_ID
      }
    );

    expect(calls).toEqual([
      { actorId: TEST_ACTOR_ID, workspaceId: ROUTE_WORKSPACE_ID }
    ]);
  });

  it.each([
    [
      "x-nashir-workspace-id",
      { headers: { [WORKSPACE_ID_HEADER]: "workspace-header" } }
    ],
    ["request body workspaceId", { body: { workspaceId: "workspace-body" } }],
    ["query string workspaceId", { query: { workspaceId: "workspace-query" } }]
  ])("does not fall back to %s", async (_caseName, untrustedSource) => {
    await expectGuardError(
      {
        verifiedIdentityContext: verifiedIdentity(),
        ...untrustedSource
      },
      400,
      "WORKSPACE_ID_REQUIRED"
    );
  });
});

describe("workspaceContextGuard — membership resolution", () => {
  it.each([
    [
      "workspace is not found",
      "workspace_not_found",
      404,
      "WORKSPACE_NOT_FOUND"
    ],
    [
      "actor is not a workspace member",
      "not_member",
      404,
      "WORKSPACE_NOT_FOUND"
    ],
    [
      "membership resolver reports unavailable",
      "unavailable",
      503,
      "WORKSPACE_MEMBERSHIP_UNAVAILABLE"
    ]
  ] as const)(
    "returns %i when %s",
    async (_caseName, outcome, statusCode, code) => {
      await expectGuardError(
        {
          verifiedIdentityContext: verifiedIdentity(),
          params: validWorkspaceParams(),
          resolver: () => ({ outcome })
        },
        statusCode,
        code
      );
    }
  );

  it("returns 503 when membership resolver throws", async () => {
    await expectGuardError(
      {
        verifiedIdentityContext: verifiedIdentity(),
        params: validWorkspaceParams(),
        resolver: () => {
          throw new Error("resolver unavailable");
        }
      },
      503,
      "WORKSPACE_MEMBERSHIP_UNAVAILABLE"
    );
  });
});

describe("workspaceContextGuard — resolved request context", () => {
  it("emits FullyResolvedRequestContext for valid actor and membership", async () => {
    await expectResolvedContext(
      {
        verifiedIdentityContext: verifiedIdentity(),
        params: validWorkspaceParams()
      },
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: TEST_WORKSPACE_ID
      }
    );
  });

  it("ignores workspace-like fields on verified identity context", async () => {
    await expectResolvedContext(
      {
        verifiedIdentityContext: {
          actorId: TEST_ACTOR_ID,
          workspaceId: "workspace-from-token"
        },
        params: validWorkspaceParams(ROUTE_WORKSPACE_ID)
      },
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: ROUTE_WORKSPACE_ID
      }
    );
  });

  it("does not attach permissions or roles to requestContext", async () => {
    const request = await expectResolvedContext(
      {
        verifiedIdentityContext: verifiedIdentity(),
        params: validWorkspaceParams()
      },
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: TEST_WORKSPACE_ID
      }
    );

    expect(request.requestContext).not.toHaveProperty("permissions");
    expect(request.requestContext).not.toHaveProperty("roles");
    expect(request.requestContext).not.toHaveProperty("grantedPermissions");
  });
});
