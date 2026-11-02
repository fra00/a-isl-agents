import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ISLBuilder } from "../runtime/builder/isl-builder";

const MINI_DOMAIN = `# Project: Mini

Mini domain leaf.

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

- **Contract**: Factory for Item.
- **Signature**: Item(data: { id: String }): Item
- **Flow**:
  1. Return object with id.

### 🚨 Constraints

- Factory MUST require id.

### ✅ Acceptance Criteria

- [ ] Item has id

### 🧪 Test Scenarios

1. **ok**: Input id → object
`;

const MINI_UI = `# Project: Mini

Presentation that references domain.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./mini-ui

---

> **Reference**: @Item in \`./mini-domain.isl.md\`.

## Component: MiniUi

### Role: Presentation

**Signature**:

- \`label\`: String

### 🔍 Appearance

- Simple label

### 📦 Content

- render label

### ⚡ Capabilities

#### show

- **Contract**: Renders label text.
- **Trigger**: mount
- **Signature**: show(): void
- **Flow**:
  1. Render \`label\`.

### 🚨 Constraints

- UI MUST NOT invent domain fields.

### ✅ Acceptance Criteria

- [ ] Renders label

### 🧪 Test Scenarios

1. **render**: label hello → visible
`;

describe("ISLBuilder", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-builder-"));
    fs.writeFileSync(path.join(tmp, "mini-domain.isl.md"), MINI_DOMAIN, "utf8");
    fs.writeFileSync(path.join(tmp, "mini-ui.isl.md"), MINI_UI, "utf8");
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("builds topo order domain before ui and writes manifest/ref/build", async () => {
    const builder = new ISLBuilder(tmp);
    await builder.build();

    const manifestPath = path.join(tmp, "build", "build-manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest).toHaveLength(2);

    const order = manifest.map((e: { sourceFile: string }) =>
      path.basename(e.sourceFile),
    );
    expect(order.indexOf("mini-domain.isl.md")).toBeLessThan(
      order.indexOf("mini-ui.isl.md"),
    );

    expect(
      fs.existsSync(path.join(tmp, "build", "mini-domain.ref.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmp, "build", "mini-domain.build.md")),
    ).toBe(true);
    expect(fs.existsSync(path.join(tmp, "build", "mini-ui.build.md"))).toBe(
      true,
    );

    const uiBuild = fs.readFileSync(
      path.join(tmp, "build", "mini-ui.build.md"),
      "utf8",
    );
    expect(uiBuild).toContain("START DEPENDENCY INTERFACE");
    expect(uiBuild).toContain("SOURCE FILE TO IMPLEMENT");
    expect(manifest.every((e: { implementationPath: string | null }) => e.implementationPath)).toBe(
      true,
    );
  });

  it("fails on broken Reference path", async () => {
    fs.writeFileSync(
      path.join(tmp, "broken.isl.md"),
      `# Project: Mini

Broken ref.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./broken

---

> **Reference**: X in \`./does-not-exist.isl.md\`.

## Component: Broken

### Role: Domain

### ⚡ Capabilities

#### noop

- **Contract**: noop
- **Signature**: noop(): void

### 🚨 Constraints

- MUST be valid structure for scan.

### ✅ Acceptance Criteria

- [ ] n/a

### 🧪 Test Scenarios

1. **n/a**
`,
      "utf8",
    );

    const logs: string[] = [];
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      await new ISLBuilder(tmp).build();
    } finally {
      console.error = orig;
    }
    expect(logs.some((l) => l.includes("Broken reference") || l.includes("Build Failed"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(tmp, "build", "build-manifest.json"))).toBe(
      false,
    );
  });
});
