/**
 * Emit a light compile packet for one build unit (SOURCE + dep bin paths).
 *
 * Usage:
 *   npx tsx runtime/cli/agent-compile-packet.ts --root examples/connect-four-workspace --build-file <abs.build.md>
 *   npx tsx runtime/cli/agent-compile-packet.ts --root examples/connect-four-workspace --next
 *   npx tsx runtime/cli/agent-compile-packet.ts --root examples/dungeon-workspace --only dungeon
 */

import * as fs from "fs";
import * as path from "path";
import type { ManifestEntry, GenLock } from "../compile-plan/types";
import { getStackConfig } from "../compile-plan/stacks.config";
import { defaultBinDir } from "../compile-plan/bin-paths";
import {
  buildAgentCompileQueue,
  resolveOnlyManifestEntries,
} from "../compile-plan/compile-plan";
import {
  buildCompilePacket,
  formatCompilePacketMarkdown,
} from "../compile-plan/compile-packet";

function parseArgs(argv: string[]) {
  const out: {
    root: string | null;
    manifest: string | null;
    bin: string | null;
    lock: string | null;
    buildFile: string | null;
    stack: string;
    next: boolean;
    json: boolean;
    force: boolean;
    only: string[];
  } = {
    root: null,
    manifest: null,
    bin: null,
    lock: null,
    buildFile: null,
    stack: "react-js",
    next: false,
    json: false,
    force: false,
    only: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--next") out.next = true;
    else if (a === "--force") out.force = true;
    else if (a === "--only" && argv[i + 1]) out.only.push(argv[++i]);
    else if (a === "--root" && argv[i + 1]) out.root = path.resolve(argv[++i]);
    else if (a === "--manifest" && argv[i + 1])
      out.manifest = path.resolve(argv[++i]);
    else if (a === "--bin" && argv[i + 1]) out.bin = path.resolve(argv[++i]);
    else if (a === "--lock" && argv[i + 1]) out.lock = path.resolve(argv[++i]);
    else if (a === "--build-file" && argv[i + 1])
      out.buildFile = path.resolve(argv[++i]);
    else if (a === "--stack" && argv[i + 1]) out.stack = argv[++i];
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  let manifestPath = args.manifest;
  let binDir = args.bin;
  let lockPath = args.lock;
  let buildFile = args.buildFile;

  if (args.root) {
    manifestPath =
      manifestPath || path.join(args.root, "build", "build-manifest.json");
    binDir = binDir || defaultBinDir(args.root, args.stack);
    lockPath = lockPath || path.join(args.root, "build", "gen-lock.json");
  }

  if (!manifestPath || !fs.existsSync(manifestPath)) {
    console.error("Need --manifest or --root with build/build-manifest.json");
    process.exit(1);
  }
  if (!binDir) {
    console.error("Need --bin or --root");
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );
  let lock: GenLock = {};
  if (lockPath && fs.existsSync(lockPath)) {
    lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
  }

  const stackConfig = getStackConfig(args.stack);

  if (args.only.length && !buildFile && !args.next) {
    try {
      const hits = resolveOnlyManifestEntries(manifest, args.only);
      if (hits.length !== 1) {
        console.error(
          `--only without --next requires exactly one unit; got ${hits.length}: ${hits
            .map((h) => path.basename(h.sourceFile))
            .join(", ")}. Use --next --only a --only b to walk them.`,
        );
        process.exit(1);
      }
      buildFile = hits[0].buildFile;
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  if (args.next || (args.only.length && !buildFile)) {
    if (args.only.length) {
      try {
        resolveOnlyManifestEntries(manifest, args.only);
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    }
    const queue = buildAgentCompileQueue(manifest, lock, binDir, stackConfig, {
      force: args.force,
      only: args.only,
    });
    if (queue.length === 0) {
      if (args.json) {
        console.log(
          JSON.stringify(
            { next: null, remaining: 0, only: args.only },
            null,
            2,
          ),
        );
      } else {
        console.log("Compile queue empty.");
      }
      process.exit(0);
    }
    buildFile = queue[0].buildFile;
  }

  if (!buildFile) {
    console.error("Need --build-file <path>, --next, or --only <unit>");
    process.exit(1);
  }

  try {
    const packet = buildCompilePacket({
      buildFile,
      manifest,
      binDir,
      stackConfig,
    });

    if (args.json) {
      console.log(JSON.stringify(packet, null, 2));
    } else {
      process.stdout.write(formatCompilePacketMarkdown(packet));
    }

    if (packet.missingDependencyBins.length > 0) {
      process.exit(2);
    }
  } catch (e: unknown) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
