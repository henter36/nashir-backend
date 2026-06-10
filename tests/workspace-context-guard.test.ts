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

function createRequest(input: {
  params?: unknown;
  verifiedIdentityContext?: unknown;
  headers?: Record<string, string>;
  body?: unknown;
  query?: unknown;
}): TestRequest {
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

async function runGuard(input: {
  params?: unknown;
  verifiedIdentityContext?: unknown;
  headers?: Record<string, string>;
  body?: unknown;
  query?: unknown;
  resolver?: WorkspaceMembershipResolver;
}) {
  const request = createRequest(input);
  const reply = createReply();

  const guard = createWorkspaceContextGuardHook({
    resolveMembership:
      input.resolver ??
      (() => ({
        outcome: "member"
      }))
  });

  await guard(request as FastifyRequest, reply as unknown as FastifyReply);

  return { request, reply };
}

describe("workspaceContextGuard — identity boundary", () => {
  it("returns 401 when VerifiedIdentityContext is missing", async () => {
    const { reply } = await runGuard({
      params: { workspaceId: "workspace-1" }
    });

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toMatchObject({
      code: "VERIFIED_IDENTITY_REQUIRED"
    });
  });

  it("returns 401 when VerifiedIdentityContext is null", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: null,
      params: { workspaceId: "workspace-1" }
    });

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toMatchObject({
      code: "VERIFIED_IDENTITY_REQUIRED"
    });
  });

  it("returns 401 when actorId is blank", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "   " },
      params: { workspaceId: "workspace-1" }
    });

    expect(reply.statusCode).toBe(401);
    expect(reply.payload).toMatchObject({
      code: "VERIFIED_IDENTITY_REQUIRED"
    });
  });

  it("does not require live Auth0 when VerifiedIdentityContext fixture exists", async () => {
    const { request, reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" }
    });

    expect(reply.statusCode).toBe(200);
    expect(reply.payload).toBeUndefined();
    expect(request.requestContext).toEqual({
      actorId: "auth0|actor-1",
      workspaceId: "workspace-1"
    });
  });
});

describe("workspaceContextGuard — workspaceId route parameter boundary", () => {
  it("returns 400 when workspaceId route parameter is missing", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: {}
    });

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_ID_REQUIRED"
    });
  });

  it("returns 400 when workspaceId format is invalid", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "bad workspace id" }
    });

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      code: "INVALID_WORKSPACE_ID"
    });
  });

  it("uses the route/path workspaceId as the only trusted workspace source", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];

    const resolver: WorkspaceMembershipResolver = (input) => {
      calls.push(input);
      return { outcome: "member" };
    };

    const { request, reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-route" },
      headers: { [WORKSPACE_ID_HEADER]: "workspace-header" },
      body: { workspaceId: "workspace-body" },
      query: { workspaceId: "workspace-query" },
      resolver
    });

    expect(reply.statusCode).toBe(200);
    expect(calls).toEqual([
      { actorId: "auth0|actor-1", workspaceId: "workspace-route" }
    ]);
    expect(request.requestContext).toEqual({
      actorId: "auth0|actor-1",
      workspaceId: "workspace-route"
    });
  });

  it("does not fall back to x-nashir-workspace-id when route param is missing", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      headers: { [WORKSPACE_ID_HEADER]: "workspace-header" }
    });

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_ID_REQUIRED"
    });
  });

  it("does not fall back to request body workspaceId", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      body: { workspaceId: "workspace-body" }
    });

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_ID_REQUIRED"
    });
  });

  it("does not fall back to query string workspaceId", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      query: { workspaceId: "workspace-query" }
    });

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_ID_REQUIRED"
    });
  });
});

describe("workspaceContextGuard — membership resolution", () => {
  it("returns 404 when workspace is not found", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" },
      resolver: () => ({ outcome: "workspace_not_found" })
    });

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_NOT_FOUND"
    });
  });

  it("returns 404 when actor is not a workspace member", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" },
      resolver: () => ({ outcome: "not_member" })
    });

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_NOT_FOUND"
    });
  });

  it("returns 503 when membership resolver reports unavailable", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" },
      resolver: () => ({ outcome: "unavailable" })
    });

    expect(reply.statusCode).toBe(503);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_MEMBERSHIP_UNAVAILABLE"
    });
  });

  it("returns 503 when membership resolver throws", async () => {
    const { reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" },
      resolver: () => {
        throw new Error("resolver unavailable");
      }
    });

    expect(reply.statusCode).toBe(503);
    expect(reply.payload).toMatchObject({
      code: "WORKSPACE_MEMBERSHIP_UNAVAILABLE"
    });
  });
});

describe("workspaceContextGuard — resolved request context", () => {
  it("emits FullyResolvedRequestContext for valid actor and membership", async () => {
    const { request, reply } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" }
    });

    expect(reply.statusCode).toBe(200);
    expect(reply.payload).toBeUndefined();
    expect(request.requestContext).toEqual({
      actorId: "auth0|actor-1",
      workspaceId: "workspace-1"
    });
  });

  it("ignores workspace-like fields on verified identity context", async () => {
    const { request } = await runGuard({
      verifiedIdentityContext: {
        actorId: "auth0|actor-1",
        workspaceId: "workspace-from-token"
      },
      params: { workspaceId: "workspace-route" }
    });

    expect(request.requestContext).toEqual({
      actorId: "auth0|actor-1",
      workspaceId: "workspace-route"
    });
  });

  it("does not attach permissions or roles to requestContext", async () => {
    const { request } = await runGuard({
      verifiedIdentityContext: { actorId: "auth0|actor-1" },
      params: { workspaceId: "workspace-1" }
    });

    expect(request.requestContext).not.toHaveProperty("permissions");
    expect(request.requestContext).not.toHaveProperty("roles");
    expect(request.requestContext).not.toHaveProperty("grantedPermissions");
  });
});
