# Nashir Backend

This repository is the private backend repository for Nashir.

## Governance Status

This repository currently contains a minimal runtime skeleton only.

The selected setup stack is TypeScript, Node.js LTS, Fastify, pnpm, Zod,
PostgreSQL, and node-postgres / pg. The `pg` package is declared only; no
database connection is created or executed.

The `/health` endpoint is an infrastructure smoke check only. It is not a
product, business, or workspace-scoped API route.

No product API routes, controllers, services, repositories, SQL migrations,
migration runner, ORM/query layer, auth implementation, generated clients,
deployment configuration, or CI workflows are authorized.

Generated clients remain blocked until a later explicit generated-client gate.

No production or pilot readiness is claimed.

`.env.example` contains placeholder variable names and values only. It contains
no real secrets, production URLs, or credentials.

## Contract Authority

The authoritative source for OpenAPI, Auth/RBAC, Workspace Identity, and SQL draft contracts remains:

- Repository: henter36/nashir
- Contract reference: cbf78f96eef3e8ccf73247bd536a9ed1d7c068a8

The OpenAPI authority location in henter36/nashir is:

- docs/nashir_v1_openapi.yaml

OpenAPI/Auth/RBAC/Workspace Identity alignment remains PENDING ALIGNMENT.

The OpenAPI contract must not be used as an active downstream synchronization authority for backend implementation, generated clients, route implementation, permission enforcement, migration/runtime work, or deployment decisions until a later explicit Auth/RBAC/OpenAPI alignment gate authorizes it.
