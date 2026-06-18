import { execFileSync } from "node:child_process";
import console from "node:console";
import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PINNED_AUTHORITY_SHA = "e22c84fa0e2b6c01d4ee98383ef9fad2d0fa3337";
const AUTHORITY_FILES = [
  "docs/nashir_v1_openapi.yaml",
  "docs/nashir_auth_rbac_workspace_identity_gate.md",
  "docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md",
  "docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md"
];
const COPIED_AUTHORITY_FILES = AUTHORITY_FILES;
const GENERATED_CLIENT_DIRECTORIES = [
  "src/generated",
  "generated",
  "openapi-generated"
];
const CI_WORKFLOW_DIRECTORY = ".github/workflows";
const ALLOWED_CI_WORKFLOW_FILES = new Set([".github/workflows/ci.yml"]);

// Fixed, root-owned directories only -- prevents "git" from resolving to a
// binary planted in a writable, attacker-controlled PATH entry.
const TRUSTED_GIT_PATH = "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin";

const backendRepo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

function parseArguments(argv) {
  const options = {
    authorityRepo: process.env.NASHIR_AUTHORITY_REPO,
    authorityRef: "HEAD"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    }

    if (argument === "--authority-repo" || argument === "--authority-ref") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value`);
      }

      if (argument === "--authority-repo") {
        options.authorityRepo = value;
      } else {
        options.authorityRef = value;
      }

      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function runReadOnlyGit(authorityRepo, args) {
  return execFileSync("git", ["-C", authorityRepo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PATH: TRUSTED_GIT_PATH }
  }).trim();
}

function verifyAbsentPaths(paths, label) {
  for (const relativePath of paths) {
    const absolutePath = resolve(backendRepo, relativePath);
    if (existsSync(absolutePath)) {
      fail(`${label} exists in backend: ${relativePath}`);
    } else {
      pass(`${label} absent from backend: ${relativePath}`);
    }
  }
}

function collectFilesRecursively(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(absolutePath));
      continue;
    }

    files.push(relative(backendRepo, absolutePath).replaceAll("\\", "/"));
  }

  return files;
}

function verifyAllowedCiWorkflows() {
  try {
    const workflowDirectory = resolve(backendRepo, CI_WORKFLOW_DIRECTORY);

    if (!existsSync(workflowDirectory)) {
      pass(
        `CI workflow directory absent from backend: ${CI_WORKFLOW_DIRECTORY}`
      );
      return;
    }

    if (!lstatSync(workflowDirectory).isDirectory()) {
      fail(`CI workflow path is not a directory: ${CI_WORKFLOW_DIRECTORY}`);
      return;
    }

    const workflowFiles = collectFilesRecursively(workflowDirectory);

    if (workflowFiles.length === 0) {
      pass(`CI workflow directory is empty: ${CI_WORKFLOW_DIRECTORY}`);
      return;
    }

    for (const workflowFile of workflowFiles) {
      if (ALLOWED_CI_WORKFLOW_FILES.has(workflowFile)) {
        pass(`Allowed CI workflow exists in backend: ${workflowFile}`);
      } else {
        fail(`Unauthorized CI workflow exists in backend: ${workflowFile}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Failed to verify CI workflows: ${message}`);
  }
}

let options;

try {
  options = parseArguments(process.argv.slice(2));
} catch (error) {
  fail(error.message);
}

if (options?.authorityRepo) {
  const requestedAuthorityRepo = resolve(options.authorityRepo);

  if (!existsSync(requestedAuthorityRepo)) {
    fail(`Authority repository path does not exist: ${requestedAuthorityRepo}`);
  } else if (lstatSync(requestedAuthorityRepo).isDirectory()) {
    const authorityRepo = realpathSync(requestedAuthorityRepo);
    pass(`Authority repository path exists: ${authorityRepo}`);

    try {
      const isGitRepository = runReadOnlyGit(authorityRepo, [
        "rev-parse",
        "--is-inside-work-tree"
      ]);

      if (isGitRepository === "true") {
        pass(`Authority repository is a Git work tree: ${authorityRepo}`);

        const resolvedAuthoritySha = runReadOnlyGit(authorityRepo, [
          "rev-parse",
          "--verify",
          `${options.authorityRef}^{commit}`
        ]);

        if (resolvedAuthoritySha === PINNED_AUTHORITY_SHA) {
          pass(
            `Authority ref ${options.authorityRef} resolves to pinned SHA ${PINNED_AUTHORITY_SHA}`
          );

          for (const relativePath of AUTHORITY_FILES) {
            try {
              runReadOnlyGit(authorityRepo, [
                "cat-file",
                "-e",
                `${PINNED_AUTHORITY_SHA}:${relativePath}`
              ]);
              pass(`Authority file exists at pinned SHA: ${relativePath}`);
            } catch {
              fail(`Authority file missing at pinned SHA: ${relativePath}`);
            }
          }
        } else {
          fail(
            `Authority ref ${options.authorityRef} resolved to ${resolvedAuthoritySha}; expected ${PINNED_AUTHORITY_SHA}`
          );
        }
      } else {
        fail(
          `Authority repository path is not a Git work tree: ${authorityRepo}`
        );
      }
    } catch (error) {
      fail(
        `Authority repository Git verification failed: ${error.stderr?.trim() || error.message}`
      );
    }
  } else {
    fail(
      `Authority repository path is not a directory: ${requestedAuthorityRepo}`
    );
  }
} else {
  fail(
    "Authority repository path is required via --authority-repo or NASHIR_AUTHORITY_REPO"
  );
}

verifyAbsentPaths(COPIED_AUTHORITY_FILES, "Copied authority file");
verifyAbsentPaths(GENERATED_CLIENT_DIRECTORIES, "Generated client directory");
verifyAllowedCiWorkflows();

if (failures.length > 0) {
  console.error(
    `FAIL: Contract authority validation failed with ${failures.length} error(s).`
  );
  process.exit(1);
}

console.log("PASS: Contract authority validation completed successfully.");
