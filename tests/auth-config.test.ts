import { describe, expect, it } from "vitest";

import { loadAuthConfig } from "../src/auth-config.js";

describe("auth config", () => {
  it("treats empty optional env vars as omitted and applies defaults", () => {
    const config = loadAuthConfig({
      AUTH0_ISSUER_URL: "https://tenant.example.auth0.com/",
      AUTH0_AUDIENCE: "https://api.test.nashir.app",
      AUTH0_JWKS_URI: "",
      JWKS_CACHE_TTL_SECONDS: "",
      JWKS_REFRESH_COOLDOWN_SECONDS: "",
      TOKEN_LEEWAY_SECONDS: ""
    });

    expect(config.AUTH0_JWKS_URI).toBeUndefined();
    expect(config.JWKS_CACHE_TTL_SECONDS).toBe(600);
    expect(config.JWKS_REFRESH_COOLDOWN_SECONDS).toBe(30);
    expect(config.TOKEN_LEEWAY_SECONDS).toBe(0);
  });
});
