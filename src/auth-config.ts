import { z } from "zod";

const httpsUrl = z
  .string()
  .refine(
    (val) => {
      try {
        return new URL(val).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "must be a valid HTTPS URL" }
  );

export const authConfigSchema = z.object({
  AUTH0_ISSUER_URL: httpsUrl.refine(
    (val) => val.endsWith("/"),
    "must end with /"
  ),
  AUTH0_AUDIENCE: z.string().min(1, "must be a non-blank string"),
  AUTH0_JWKS_URI: z.preprocess((val) => (val === "" ? undefined : val), httpsUrl.optional()),
  JWKS_CACHE_TTL_SECONDS: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().positive().default(600)
  ),
  JWKS_REFRESH_COOLDOWN_SECONDS: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().positive().default(30)
  ),
  TOKEN_LEEWAY_SECONDS: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(0).max(60).default(0)
  )
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

export function loadAuthConfig(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >
): AuthConfig {
  const result = authConfigSchema.safeParse({
    AUTH0_ISSUER_URL: env["AUTH0_ISSUER_URL"],
    AUTH0_AUDIENCE: env["AUTH0_AUDIENCE"],
    AUTH0_JWKS_URI: env["AUTH0_JWKS_URI"],
    JWKS_CACHE_TTL_SECONDS: env["JWKS_CACHE_TTL_SECONDS"],
    JWKS_REFRESH_COOLDOWN_SECONDS: env["JWKS_REFRESH_COOLDOWN_SECONDS"],
    TOKEN_LEEWAY_SECONDS: env["TOKEN_LEEWAY_SECONDS"]
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join(".") || "config"}: ${i.message}`)
      .join("; ");
    throw new Error(`Auth configuration validation failed: ${messages}`);
  }

  return result.data;
}
