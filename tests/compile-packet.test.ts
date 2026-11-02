import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ISLBuilder } from "../runtime/builder/isl-builder";
import { getStackConfig } from "../runtime/compile-plan/stacks.config";
import {
  buildCompilePacket,
  formatCompilePacketMarkdown,
  SOURCE_MARK,
} from "../runtime/compile-plan/compile-packet";
import type { ManifestEntry } from "../runtime/compile-plan/types";

const DOMAIN = `# Project: Mini

Leaf domain.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./mini-domain

---

## Domain Concepts

### Item

- **Identity**: id
- **Properties**:
  - \`id\`: String

## Component: MiniDomain

### Role: Domain

### ⚡ Capabilities

#### Item

- **Contract**: Factory.
- **Signature**: Item(data: { id: String }): Item
- **Flow**:
  1. Return { id }.

### 🚨 Constraints

- MUST require id.

### ✅ Acceptance Criteria

- [ ] ok

### 🧪 Test Scenarios

1. **ok**
`;

const UI = `# Project: Mini

UI refs domain.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./mini-ui

---

> **Reference**: @Item in \`./mini-domain.isl.md\`.

## Component: MiniUi

### Role: Presentation

### ⚡ Capabilities

#### show

- **Contract**: Renders.
- **Signature**: show(): void
- **Flow**:
  1. Render.

### 🚨 Constraints

- MUST import domain.

### ✅ Acceptance Criteria

- [ ] ok

### 🧪 Test Scenarios

1. **ok**
`;

describe("compile-packet", () => {
  let tmp: string;
  let manifest: ManifestEntry[];

  beforeEach(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-packet-"));
    fs.writeFileSync(path.join(tmp, "mini-domain.isl.md"), DOMAIN, "utf8");
    fs.writeFileSync(path.join(tmp, "mini-ui.isl.md"), UI, "utf8");
    await new ISLBuilder(tmp).build();
    manifest = JSON.parse(
      fs.readFileSync(path.join(tmp, "build", "build-manifest.json"), "utf8"),
    );
    fs.mkdirSync(path.join(tmp, "bin"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("emits SOURCE only and flags missing dep bin", () => {
    const ui = manifest.find((e) =>
      e.sourceFile.endsWith("mini-ui.isl.md"),
    )!;
    const packet = buildCompilePacket({
      buildFile: ui.buildFile,
      manifest,
      binDir: path.join(tmp, "bin"),
      stackConfig: getStackConfig("react-js"),
    });

    expect(packet.mode).toBe("light");
    expect(packet.sourceMarkdown).toContain("# Project: Mini");
    expect(packet.sourceMarkdown).toContain("### Role: Presentation");
    expect(packet.sourceMarkdown).not.toContain("START DEPENDENCY INTERFACE");
    expect(packet.dependencies).toHaveLength(1);
    expect(packet.dependencies[0].binExists).toBe(false);
    expect(packet.missingDependencyBins).toContain("mini-domain.isl.md");

    const md = formatCompilePacketMarkdown(packet);
    expect(md).toContain("## SOURCE");
    expect(md).toContain("[MISSING]");
  });

  it("marks dep bin ok after leaf exists", () => {
    const domain = manifest.find((e) =>
      e.sourceFile.endsWith("mini-domain.isl.md"),
    )!;
    const domainPacket = buildCompilePacket({
      buildFile: domain.buildFile,
      manifest,
      binDir: path.join(tmp, "bin"),
      stackConfig: getStackConfig("react-js"),
    });
    fs.writeFileSync(domainPacket.targetPath, "export const Item = () => ({});", "utf8");

    const ui = manifest.find((e) =>
      e.sourceFile.endsWith("mini-ui.isl.md"),
    )!;
    const packet = buildCompilePacket({
      buildFile: ui.buildFile,
      manifest,
      binDir: path.join(tmp, "bin"),
      stackConfig: getStackConfig("react-js"),
    });
    expect(packet.missingDependencyBins).toEqual([]);
    expect(packet.dependencies[0].binExists).toBe(true);
    expect(fs.existsSync(packet.dependencies[0].binPath!)).toBe(true);
  });

  it("full build still has SOURCE mark for escalation path", () => {
    const ui = manifest.find((e) =>
      e.sourceFile.endsWith("mini-ui.isl.md"),
    )!;
    const raw = fs.readFileSync(ui.buildFile, "utf8");
    expect(raw).toContain(SOURCE_MARK);
    expect(raw).toContain("START DEPENDENCY INTERFACE");
  });
});
