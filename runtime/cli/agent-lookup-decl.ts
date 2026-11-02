/**
 * EXT-002: lookup a declaration / type span in bin-* (or fixtures).
 *
 * Exit: 0 = hit, 2 = no_match, 3 = usage/path/stack error
 */

import * as path from "path";
import {
  appendLookupLog,
  lookupDeclaration,
} from "../compile-plan/lookup-decl";

function parseArgs(argv: string[]) {
  let stackId: string | null = null;
  let name: string | null = null;
  let kind: "value" | "type" | "any" = "any";
  const files: string[] = [];
  let dir: string | null = null;
  let workspace: string | null = null;
  let includeTests = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stack" && argv[i + 1]) stackId = argv[++i];
    else if (a === "--name" && argv[i + 1]) name = argv[++i];
    else if (a === "--kind" && argv[i + 1]) {
      const k = argv[++i];
      if (k === "value" || k === "type" || k === "any") kind = k;
    } else if (a === "--file" && argv[i + 1]) files.push(path.resolve(argv[++i]));
    else if (a === "--dir" && argv[i + 1]) dir = path.resolve(argv[++i]);
    else if (a === "--workspace" && argv[i + 1])
      workspace = path.resolve(argv[++i]);
    else if (a === "--include-tests") includeTests = true;
  }

  if (!workspace) {
    workspace = files[0]
      ? path.resolve(files[0], "../..")
      : dir
        ? path.resolve(dir, "..")
        : process.cwd();
  }

  return { stackId, name, kind, files, dir, workspace, includeTests };
}

function main() {
  const t0 = Date.now();
  const args = parseArgs(process.argv.slice(2));
  if (!args.stackId || !args.name) {
    const payload = {
      ok: false,
      reason: "bad_args",
      message:
        "Usage: lookup-decl --stack <id> --name <SpecName> [--file path]... [--dir path] [--workspace root] [--kind value|type|any]",
      selected: null,
      candidates: [],
    };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(3);
  }
  if (!args.files.length && !args.dir) {
    const payload = {
      ok: false,
      reason: "bad_args",
      message: "provide --file and/or --dir",
      selected: null,
      candidates: [],
    };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(3);
  }

  const result = lookupDeclaration({
    stackId: args.stackId,
    name: args.name,
    kind: args.kind,
    files: args.files,
    dir: args.dir,
    workspace: args.workspace!,
    includeTests: args.includeTests,
  });

  appendLookupLog(args.workspace!, {
    stackId: result.stackId,
    reason: result.reason,
    candidateCount: result.candidates.length,
    spanTruncatedAny: result.candidates.some((c) => c.spanTruncated),
    durationMs: Date.now() - t0,
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.ok) process.exit(0);
  if (result.reason === "no_match") process.exit(2);
  process.exit(3);
}

main();
