import { execFileSync } from "node:child_process";
import console from "node:console";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const PINNED_AUTHORITY_SHA = "04f54f8be852001173f4014cb2d81c5cdb97e35c";

const REQUIRED_AUTHORITY_FILES = [
  "docs/nashir_v1_openapi.yaml",
  "docs/nashir_ai_agent_runtime_selection_planning_gate.md"
];

const AGENT_RUNTIME_GATE_PATH =
  "docs/nashir_ai_agent_runtime_selection_planning_gate.md";

const AGENT_RUNTIME_GATE_REQUIRED_MARKERS = [
  "Decision:",
  "Recommended Next Step",
  "documentation-only",
  "does not authorize",
  "runtime dependencies",
  "backend implementation",
  "provider calls",
  "prompt execution",
  "tool execution",
  "connector execution",
  "generated clients",
  "SQL",
  "migrations",
  "CI workflows",
  "production",
  "pilot"
];

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
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

let options;

try {
  options = parseArguments(process.argv.slice(2));
} catch (error) {
  fail(error.message);
}

if (!options?.authorityRepo) {
  fail(
    "Authority repository path is required via --authority-repo or NASHIR_AUTHORITY_REPO"
  );
} else {
  const requestedAuthorityRepo = resolve(options.authorityRepo);

  if (!existsSync(requestedAuthorityRepo)) {
    fail(`Authority repository path does not exist: ${requestedAuthorityRepo}`);
  } else if (!lstatSync(requestedAuthorityRepo).isDirectory()) {
    fail(
      `Authority repository path is not a directory: ${requestedAuthorityRepo}`
    );
  } else {
    const authorityRepo = realpathSync(requestedAuthorityRepo);
    pass(`Authority repository path exists: ${authorityRepo}`);

    try {
      const isGitRepository = runReadOnlyGit(authorityRepo, [
        "rev-parse",
        "--is-inside-work-tree"
      ]);

      if (isGitRepository !== "true") {
        fail(
          `Authority repository path is not a Git work tree: ${authorityRepo}`
        );
      } else {
        pass(`Authority repository is a Git work tree: ${authorityRepo}`);

        const resolvedAuthoritySha = runReadOnlyGit(authorityRepo, [
          "rev-parse",
          "--verify",
          `${options.authorityRef}^{commit}`
        ]);

        if (resolvedAuthoritySha !== PINNED_AUTHORITY_SHA) {
          fail(
            `Authority ref ${options.authorityRef} resolved to ${resolvedAuthoritySha}; expected pinned SHA ${PINNED_AUTHORITY_SHA}`
          );
        } else {
          pass(
            `Authority ref ${options.authorityRef} resolves to pinned SHA ${PINNED_AUTHORITY_SHA}`
          );

          for (const relativePath of REQUIRED_AUTHORITY_FILES) {
            try {
              runReadOnlyGit(authorityRepo, [
                "cat-file",
                "-e",
                `${PINNED_AUTHORITY_SHA}:${relativePath}`
              ]);
              pass(`Contract authority file exists at pinned SHA: ${relativePath}`);
            } catch {
              fail(`Contract authority file missing at pinned SHA: ${relativePath}`);
            }
          }

          try {
            const gateContent = runReadOnlyGit(authorityRepo, [
              "show",
              `${PINNED_AUTHORITY_SHA}:${AGENT_RUNTIME_GATE_PATH}`
            ]);

            for (const marker of AGENT_RUNTIME_GATE_REQUIRED_MARKERS) {
              if (gateContent.includes(marker)) {
                pass(`Agent Runtime planning gate contains required marker: "${marker}"`);
              } else {
                fail(`Agent Runtime planning gate is missing required marker: "${marker}"`);
              }
            }
          } catch (error) {
            fail(
              `Failed to read Agent Runtime planning gate at pinned SHA: ${error.stderr?.trim() || error.message}`
            );
          }
        }
      }
    } catch (error) {
      fail(
        `Authority repository Git verification failed: ${error.stderr?.trim() || error.message}`
      );
    }
  }
}

if (failures.length > 0) {
  console.error(
    `FAIL: Contract validation failed with ${failures.length} error(s).`
  );
  process.exit(1);
}

console.log("PASS: Contract validation completed successfully.");
