import * as path from "path";

/** Implementation output folder name for a stack, e.g. react-js → bin-react-js */
export function binDirNameForStack(stackId: string): string {
  const id = (stackId || "react-js").trim() || "react-js";
  return `bin-${id}`;
}

/** Absolute default bin dir under a workspace root for the given stack. */
export function defaultBinDir(projectRoot: string, stackId: string): string {
  return path.join(path.resolve(projectRoot), binDirNameForStack(stackId));
}

/** Skip scanning these dirs for .isl.md (builder / preflight). */
export function shouldSkipProjectDir(name: string): boolean {
  if (
    name === "node_modules" ||
    name === "build" ||
    name === "logic-test" ||
    name === "verify" ||
    name === "demo" ||
    name === "demo-blazor" ||
    name === "demo-winforms" ||
    name === "bin" ||
    name.startsWith(".")
  ) {
    return true;
  }
  if (name.startsWith("bin-")) return true;
  return false;
}
