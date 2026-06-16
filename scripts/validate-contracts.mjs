import console from "node:console";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const EXPECTED_AUTHORITY_COMMIT = "7962a35cec6f8372501b3a7b92062288e9b1d958";

const REQUIRED_CONTRACT_FILES = [
  "docs/nashir_v1_openapi.yaml",
  "docs/nashir_ai_agent_runtime_selection_planning_gate.md"
];

const AGENT_RUNTIME_GATE_RELATIVE_PATH = REQUIRED_CONTRACT_FILES[1];

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

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;

const outcomes = [];

function report(ok, message) {
  outcomes.push(ok);
  (ok ? console.log : console.error)(`${ok ? "PASS" : "FAIL"}: ${message}`);
}

function stopNow(message) {
  report(false, message);
  console.error("FAIL: Stopping immediately; no further checks were run.");
  process.exit(1);
}

function parseArguments(argv) {
  let authorityRepo = process.env.NASHIR_AUTHORITY_REPO ?? null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument !== "--authority-repo") {
      return { error: `Unknown argument: ${argument}` };
    }

    const value = argv[index + 1];
    if (!value) {
      return { error: "--authority-repo requires a path value" };
    }

    authorityRepo = value;
    index += 1;
  }

  if (!authorityRepo) {
    return {
      error:
        "Authority repository path is required via --authority-repo or NASHIR_AUTHORITY_REPO"
    };
  }

  return { authorityRepo };
}

function readWorkingTreeFile(repoPath, relativePath) {
  const absolutePath = resolve(repoPath, relativePath);

  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return null;
  }

  return readFileSync(absolutePath, "utf8");
}

// Reads HEAD/refs/packed-refs directly so this script never has to spawn git.
function readCommitFromGitMetadata(repoPath) {
  try {
    const head = readFileSync(resolve(repoPath, ".git", "HEAD"), "utf8").trim();

    if (COMMIT_SHA_PATTERN.test(head)) {
      return head;
    }

    const symbolicRef = /^ref:\s*(\S+)$/.exec(head)?.[1];
    if (!symbolicRef) {
      return null;
    }

    const refPath = resolve(repoPath, ".git", symbolicRef);
    if (existsSync(refPath)) {
      const ref = readFileSync(refPath, "utf8").trim();
      return COMMIT_SHA_PATTERN.test(ref) ? ref : null;
    }

    const packedRefs = readFileSync(
      resolve(repoPath, ".git", "packed-refs"),
      "utf8"
    );
    for (const line of packedRefs.split("\n")) {
      const [sha, name] = line.trim().split(/\s+/);
      if (name === symbolicRef && COMMIT_SHA_PATTERN.test(sha)) {
        return sha;
      }
    }

    return null;
  } catch {
    return null;
  }
}

const parsed = parseArguments(process.argv.slice(2));

if (parsed.error) {
  stopNow(parsed.error);
}

const authorityRepoPath = resolve(parsed.authorityRepo);

if (
  !existsSync(authorityRepoPath) ||
  !statSync(authorityRepoPath).isDirectory()
) {
  stopNow(
    `Authority repository path is not a local directory: ${authorityRepoPath}`
  );
}

report(true, `Authority repository directory found: ${authorityRepoPath}`);

for (const relativePath of REQUIRED_CONTRACT_FILES) {
  const present = readWorkingTreeFile(authorityRepoPath, relativePath) !== null;
  report(
    present,
    `Required contract file ${present ? "present" : "missing"} in working tree: ${relativePath}`
  );
}

const gateContent = readWorkingTreeFile(
  authorityRepoPath,
  AGENT_RUNTIME_GATE_RELATIVE_PATH
);

if (gateContent === null) {
  report(
    false,
    `Cannot check Agent Runtime planning gate markers; file is missing: ${AGENT_RUNTIME_GATE_RELATIVE_PATH}`
  );
} else {
  for (const marker of AGENT_RUNTIME_GATE_REQUIRED_MARKERS) {
    const found = gateContent.includes(marker);
    report(
      found,
      `Agent Runtime planning gate ${found ? "contains" : "is missing"} required marker: "${marker}"`
    );
  }
}

const observedCommit = readCommitFromGitMetadata(authorityRepoPath);

if (observedCommit === null) {
  console.warn(
    "WARN: Could not determine the authority repository commit from local .git metadata; " +
      "skipping the pinned-commit comparison. This script performs local, read-only " +
      "validation only and intentionally avoids running git."
  );
} else if (observedCommit === EXPECTED_AUTHORITY_COMMIT) {
  report(
    true,
    `Authority repository HEAD matches the expected contract reference commit: ${EXPECTED_AUTHORITY_COMMIT}`
  );
} else {
  console.warn(
    `WARN: Authority repository HEAD (${observedCommit}) differs from the expected contract ` +
      `reference commit (${EXPECTED_AUTHORITY_COMMIT}). Confirm this is the intended ` +
      "henter36/nashir checkout before relying on this run."
  );
}

const failureCount = outcomes.filter((ok) => !ok).length;

if (failureCount > 0) {
  console.error(
    `FAIL: Contract validation failed with ${failureCount} error(s).`
  );
  process.exit(1);
}

console.log("PASS: Contract validation completed successfully.");
