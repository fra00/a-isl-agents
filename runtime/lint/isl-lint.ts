#!/usr/bin/env node

/**
 * ISL Lint - CLI Validator per Intent Specification Language v1.6.2
 *
 * Valida specifiche ISL verificando:
 * - Struttura gerarchica corretta
 * - Presenza sezioni obbligatorie (REQUIRED)
 * - Emoji semantiche corrette
 * - Coerenza Domain Concepts
 * - RFC 2119 keywords nei Constraints
 * - Presenza Test Scenarios per Capabilities complesse
 */

import * as fs from "fs";
import * as path from "path";

// ==================== TYPES ====================

interface ValidationError {
  severity: "error" | "warning" | "info";
  line?: number;
  section: string;
  message: string;
  rule: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  stats: {
    components: number;
    capabilities: number;
    constraints: number;
    testScenarios: number;
    domainConcepts: number;
  };
}

interface ISLSection {
  type: string;
  title: string;
  content: string;
  line: number;
  level: number;
  emoji?: string;
}

// ==================== CONFIGURATION ====================

const ISL_CONFIG = {
  version: "1.6.2",

  // Emoji semantiche valide
  validEmojis: {
    appearance: "🔍",
    content: "📦",
    capabilities: "⚡",
    hints: "💡",
    constraints: "🚨",
    acceptance: "✅",
    tests: "🧪",
  },

  // RFC 2119 Keywords
  rfc2119Keywords: [
    "MUST",
    "MUST NOT",
    "REQUIRED",
    "SHALL",
    "SHALL NOT",
    "SHOULD",
    "SHOULD NOT",
    "RECOMMENDED",
    "MAY",
    "OPTIONAL",
  ],

  // Sezioni obbligatorie a livello Component
  requiredComponentSections: ["Role"],

  // Campi obbligatori per Capability
  requiredCapabilityFields: ["Contract"],
};

// ==================== PARSER ====================

class ISLParser {
  private lines: string[];
  private sections: ISLSection[] = [];

  constructor(content: string) {
    this.lines = content.split(/\r?\n/);
  }

  parse(): ISLSection[] {
    this.sections = [];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        // Estrai emoji se presente
        const emojiMatch = title.match(/^([🔍📦⚡💡🚨✅🧪])\s+(.+)$/);
        const emoji = emojiMatch ? emojiMatch[1] : undefined;
        const cleanTitle = emojiMatch ? emojiMatch[2] : title;

        // Estrai contenuto fino alla prossima heading
        const content = this.extractContent(i + 1);

        this.sections.push({
          type: this.inferType(level, cleanTitle, emoji),
          title: cleanTitle,
          content,
          line: i + 1,
          level,
          emoji,
        });
      }
    }

    return this.sections;
  }

  private extractContent(startLine: number): string {
    const contentLines: string[] = [];
    let inCodeBlock = false;

    for (let i = startLine; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock && line.match(/^#{1,4}\s+/)) {
        break;
      }
      contentLines.push(line);
    }

    return contentLines.join("\n").trim();
  }

  private inferType(level: number, title: string, emoji?: string): string {
    if (level === 1) return "project";
    if (level === 2) {
      if (title.includes("Domain Concepts")) return "domain";
      if (title.includes("Component:")) return "component";
      return "section";
    }
    if (level === 3) {
      if (emoji) {
        const emojiTypes: Record<string, string> = {
          "🔍": "appearance",
          "📦": "content",
          "⚡": "capabilities",
          "💡": "hints",
          "🚨": "constraints",
          "✅": "acceptance",
          "🧪": "tests",
        };
        return emojiTypes[emoji] || "subsection";
      }
      if (title.includes("Role")) return "role";
      return "subsection";
    }
    if (level === 4) return "capability";
    return "unknown";
  }

  getSections(): ISLSection[] {
    return this.sections;
  }
}

// ==================== VALIDATORS ====================

class ISLValidator {
  private sections: ISLSection[];
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private info: ValidationError[] = [];
  private domainConcepts: Set<string> = new Set();

  constructor(sections: ISLSection[]) {
    this.sections = sections;
  }

  validate(): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.info = [];

    // Validazioni
    this.validateProjectHeader();
    this.validateDomainConcepts();
    this.validateComponents();
    this.validateCapabilities();
    this.checkOrphanedSections();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      stats: this.calculateStats(),
    };
  }

  private validateProjectHeader(): void {
    const projectSection = this.sections.find((s) => s.type === "project");

    if (!projectSection) {
      this.errors.push({
        severity: "error",
        section: "Project",
        message: "Missing project header (# Project: Name)",
        rule: "ISL-001",
      });
      return;
    }

    if (!projectSection.title.includes("Project:")) {
      this.warnings.push({
        severity: "warning",
        line: projectSection.line,
        section: "Project",
        message:
          'Project header should follow format: "# Project: YourProjectName"',
        rule: "ISL-002",
      });
    }

    // Verifica presenza di descrizione nel content
    if (projectSection.content.length < 20) {
      this.warnings.push({
        severity: "warning",
        line: projectSection.line,
        section: "Project",
        message:
          "Project description is too short (should be at least 1-3 sentences)",
        rule: "ISL-003",
      });
    }
  }

  private validateDomainConcepts(): void {
    const domainSection = this.sections.find((s) => s.type === "domain");

    if (!domainSection) {
      this.warnings.push({
        severity: "warning",
        section: "Domain Concepts",
        message:
          'Missing "## Domain Concepts" section. Domain entities should be defined.',
        rule: "ISL-010",
      });
      return;
    }

    // FIX: Iterate through subsequent sections instead of regexing content
    // Domain entities are typically Level 3 subsections following the Domain Concepts header
    const domainSectionIndex = this.sections.indexOf(domainSection);

    for (let i = domainSectionIndex + 1; i < this.sections.length; i++) {
      const section = this.sections[i];

      // Stop if we encounter a new section of Level 1 or 2 (e.g. Component)
      if (section.level <= 2) break;

      // We assume Level 3 headers inside Domain Concepts are Entities
      if (section.level === 3) {
        const entityName = section.title;
        this.domainConcepts.add(entityName);

        if (!section.content.includes("**Identity**:")) {
          this.warnings.push({
            severity: "warning",
            section: `Domain Concepts > ${entityName}`,
            message: `Entity "${entityName}" missing **Identity** field`,
            rule: "ISL-011",
          });
        }

        if (!section.content.includes("**Properties**:")) {
          this.warnings.push({
            severity: "warning",
            section: `Domain Concepts > ${entityName}`,
            message: `Entity "${entityName}" missing **Properties** field`,
            rule: "ISL-012",
          });
        }
      }
    }

    this.info.push({
      severity: "info",
      section: "Domain Concepts",
      message: `Found ${this.domainConcepts.size} domain entities: ${Array.from(this.domainConcepts).join(", ")}`,
      rule: "ISL-INFO",
    });
  }

  private validateComponents(): void {
    const components = this.sections.filter((s) => s.type === "component");

    if (components.length === 0) {
      this.errors.push({
        severity: "error",
        section: "Components",
        message:
          'No components found. At least one "## Component: Name" is required.',
        rule: "ISL-020",
      });
      return;
    }

    components.forEach((component) => {
      this.validateComponent(component);
    });
  }

  private validateComponent(component: ISLSection): void {
    const componentName = component.title.replace("Component:", "").trim();

    // Verifica presenza di Role (REQUIRED)
    const roleSection = this.findSubsection(component, "role");

    if (!roleSection) {
      this.errors.push({
        severity: "error",
        line: component.line,
        section: `Component: ${componentName}`,
        message:
          'Missing required section: "### Role: Presentation / Backend / Domain / Business Logic / Test"',
        rule: "ISL-021",
      });
    } else {
      // Standard ISL roles (Presentation, Backend, Domain, Business Logic, Test)
      const roleText = `${roleSection.title} ${roleSection.content}`;
      const roleMatch = roleText.match(
        /(Presentation|Backend|Domain|Business Logic|Test)/,
      );
      if (!roleMatch) {
        this.errors.push({
          severity: "error",
          line: roleSection.line,
          section: `Component: ${componentName} > Role`,
          message:
            'Role must be one of: Presentation, Backend, Domain, Business Logic, Test',
          rule: "ISL-022",
        });
      }
    }

    // Verifica presenza di Signature (RECOMMENDED)
    // Può trovarsi nel content del Component (prima di Role) o nel content di Role
    const hasSignature =
      component.content.includes("**Signature**:") ||
      (roleSection && roleSection.content.includes("**Signature**:"));

    if (!hasSignature) {
      this.info.push({
        severity: "info",
        line: component.line,
        section: `Component: ${componentName}`,
        message: "Missing recommended field: **Signature** (Props/Constructor)",
        rule: "ISL-025",
      });
    }

    // Verifica presenza di almeno una Capability o giustificazione
    const capabilitiesSection = this.findSubsection(component, "capabilities");

    if (!capabilitiesSection) {
      this.warnings.push({
        severity: "warning",
        line: component.line,
        section: `Component: ${componentName}`,
        message:
          'No "### ⚡ Capabilities / Methods" section found. Components should define behaviors.',
        rule: "ISL-023",
      });
    }

    // Verifica emoji corrette nelle subsections
    this.validateComponentEmojis(component, componentName);
  }

  private validateComponentEmojis(
    component: ISLSection,
    componentName: string,
  ): void {
    const subsections = this.sections.filter(
      (s) =>
        s.line > component.line &&
        s.level === 3 &&
        (this.sections.find(
          (next) => next.line > s.line && next.type === "component",
        )?.line ?? Infinity) > s.line,
    );

    subsections.forEach((sub) => {
      if (sub.emoji) {
        const validEmojis = Object.values(ISL_CONFIG.validEmojis);
        if (!validEmojis.includes(sub.emoji)) {
          this.warnings.push({
            severity: "warning",
            line: sub.line,
            section: `Component: ${componentName}`,
            message: `Invalid emoji "${sub.emoji}". Valid emojis: ${validEmojis.join(" ")}`,
            rule: "ISL-024",
          });
        }
      }
    });
  }

  private validateCapabilities(): void {
    const capabilities = this.sections.filter((s) => s.type === "capability");

    capabilities.forEach((cap) => {
      this.validateCapability(cap);
    });
  }

  private validateCapability(capability: ISLSection): void {
    const capName = capability.title;

    // Verifica presenza di Contract (REQUIRED)
    const contractRegex = /\*\*Contract(:\*\*|\*\* *:)/i;
    if (!contractRegex.test(capability.content)) {
      this.errors.push({
        severity: "error",
        line: capability.line,
        section: `Capability: ${capName}`,
        message: "Missing required field: **Contract**",
        rule: "ISL-030",
      });
    }

    // Verifica presenza di Signature o Input (RECOMMENDED)
    const signatureRegex = /\*\*(Signature|Input)(:\*\*|\*\* *:)/i;
    if (!signatureRegex.test(capability.content)) {
      this.info.push({
        severity: "info",
        line: capability.line,
        section: `Capability: ${capName}`,
        message: "Missing recommended field: **Signature** or **Input**",
        rule: "ISL-031",
      });
    }

    // Verifica presenza di Constraints
    const hasConstraints = capability.content.includes("**🚨 Constraint**:");

    if (hasConstraints) {
      this.validateConstraints(capability);
    }

    // Verifica presenza di Test Scenarios per Capabilities complesse
    const hasFlow = capability.content.includes("**Flow:**");
    const hasTests = capability.content.includes("**🧪 Test Scenarios**:");

    if (hasFlow && !hasTests) {
      this.warnings.push({
        severity: "warning",
        line: capability.line,
        section: `Capability: ${capName}`,
        message: "Complex capability with Flow should have Test Scenarios",
        rule: "ISL-032",
      });
    }

    // Verifica riferimenti a Domain Concepts non definiti
    this.validateDomainReferences(capability);
  }

  private validateConstraints(capability: ISLSection): void {
    const capName = capability.title;
    const constraintSection = this.extractFieldContent(
      capability.content,
      "**🚨 Constraint**:",
    );

    // Verifica presenza di RFC 2119 keywords
    const hasRFC2119 = ISL_CONFIG.rfc2119Keywords.some((keyword) =>
      constraintSection.includes(keyword),
    );

    if (!hasRFC2119) {
      this.warnings.push({
        severity: "warning",
        line: capability.line,
        section: `Capability: ${capName}`,
        message: `Constraints should use RFC 2119 keywords (${ISL_CONFIG.rfc2119Keywords.slice(0, 5).join(", ")}, ...)`,
        rule: "ISL-033",
      });
    }
  }

  private validateDomainReferences(capability: ISLSection): void {
    const capName = capability.title;

    // Cerca pattern come {entityName: Type} o Command, CommandGroup
    const typePattern = /[{,]\s*([A-Z][a-zA-Z]+)(?:\[\])?[}:,\s]/g;
    let match;

    while ((match = typePattern.exec(capability.content)) !== null) {
      const typeName = match[1];

      // Ignora tipi primitivi comuni
      if (
        ["String", "Number", "Boolean", "Array", "Object", "Date"].includes(
          typeName,
        )
      ) {
        continue;
      }

      if (!this.domainConcepts.has(typeName)) {
        this.warnings.push({
          severity: "warning",
          line: capability.line,
          section: `Capability: ${capName}`,
          message: `Reference to undefined domain entity: "${typeName}". Define it in Domain Concepts.`,
          rule: "ISL-034",
        });
      }
    }
  }

  private extractFieldContent(content: string, fieldMarker: string): string {
    const startIdx = content.indexOf(fieldMarker);
    if (startIdx === -1) return "";

    const afterMarker = content.slice(startIdx + fieldMarker.length);
    const nextFieldIdx = afterMarker.search(/\*\*[A-Z]/);

    return nextFieldIdx === -1
      ? afterMarker
      : afterMarker.slice(0, nextFieldIdx);
  }

  private checkOrphanedSections(): void {
    // Verifica sezioni con emoji ma fuori da un Component
    const orphanedEmoji = this.sections.filter(
      (s) => s.emoji && s.level === 3 && !this.isInsideComponent(s),
    );

    orphanedEmoji.forEach((section) => {
      this.warnings.push({
        severity: "warning",
        line: section.line,
        section: section.title,
        message: "Section with semantic emoji outside of a Component context",
        rule: "ISL-040",
      });
    });
  }

  private isInsideComponent(section: ISLSection): boolean {
    // Trova il Component più vicino prima di questa sezione
    const componentsBeforeThis = this.sections.filter(
      (s) => s.type === "component" && s.line < section.line,
    );

    if (componentsBeforeThis.length === 0) return false;

    const lastComponent = componentsBeforeThis[componentsBeforeThis.length - 1];

    // Verifica se c'è un altro Component tra lastComponent e section
    const componentsBetween = this.sections.filter(
      (s) =>
        s.type === "component" &&
        s.line > lastComponent.line &&
        s.line < section.line,
    );

    return componentsBetween.length === 0;
  }

  private findSubsection(
    component: ISLSection,
    type: string,
  ): ISLSection | undefined {
    const nextComponent = this.sections.find(
      (s) => s.type === "component" && s.line > component.line,
    );

    const nextComponentLine = nextComponent?.line ?? Infinity;

    return this.sections.find(
      (s) =>
        s.type === type &&
        s.line > component.line &&
        s.line < nextComponentLine,
    );
  }

  private calculateStats() {
    return {
      components: this.sections.filter((s) => s.type === "component").length,
      capabilities: this.sections.filter((s) => s.type === "capability").length,
      constraints: this.sections.filter((s) =>
        s.content.includes("**🚨 Constraint**:"),
      ).length,
      testScenarios: this.sections.filter((s) =>
        s.content.includes("**🧪 Test Scenarios**:"),
      ).length,
      domainConcepts: this.domainConcepts.size,
    };
  }
}

// ==================== REPORTER ====================

class Reporter {
  static report(result: ValidationResult, filepath: string): void {
    console.log("\n" + "=".repeat(60));
    console.log(`ISL Lint v${ISL_CONFIG.version} - Validation Report`);
    console.log("=".repeat(60));
    console.log(`File: ${filepath}\n`);

    // Stats
    console.log("📊 Statistics:");
    console.log(`   Components: ${result.stats.components}`);
    console.log(`   Capabilities: ${result.stats.capabilities}`);
    console.log(`   Constraints: ${result.stats.constraints}`);
    console.log(`   Test Scenarios: ${result.stats.testScenarios}`);
    console.log(`   Domain Concepts: ${result.stats.domainConcepts}\n`);

    // Errors
    if (result.errors.length > 0) {
      console.log(`❌ Errors (${result.errors.length}):`);
      result.errors.forEach((err) => {
        const location = err.line ? `Line ${err.line}` : err.section;
        console.log(`   [${err.rule}] ${location}`);
        console.log(`   ${err.message}\n`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log(`⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach((warn) => {
        const location = warn.line ? `Line ${warn.line}` : warn.section;
        console.log(`   [${warn.rule}] ${location}`);
        console.log(`   ${warn.message}\n`);
      });
    }

    // Info
    if (result.info.length > 0) {
      console.log(`ℹ️  Info (${result.info.length}):`);
      result.info.forEach((info) => {
        console.log(`   ${info.message}\n`);
      });
    }

    // Summary
    console.log("=".repeat(60));
    if (result.valid) {
      console.log("✅ Validation PASSED");
    } else {
      console.log("❌ Validation FAILED");
      console.log(`   ${result.errors.length} error(s) must be fixed`);
    }
    console.log("=".repeat(60) + "\n");
  }

  static reportJSON(result: ValidationResult): void {
    console.log(JSON.stringify(result, null, 2));
  }
}

// ==================== CLI ====================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
ISL Lint - Intent Specification Language Validator v${ISL_CONFIG.version}

Usage:
  isl-lint <file.isl.md> [options]

Options:
  --json          Output results as JSON
  --strict        Treat warnings as errors
  --help, -h      Show this help message

Examples:
  isl-lint spec.isl.md
  isl-lint spec.isl.md --json
  isl-lint spec.isl.md --strict

Rules:
  ISL-001  Missing project header
  ISL-010  Missing Domain Concepts
  ISL-020  No components defined
  ISL-021  Component missing Role
  ISL-030  Capability missing Contract
  ISL-033  Constraints missing RFC 2119 keywords
  ISL-034  Reference to undefined domain entity
    `);
    process.exit(0);
  }

  const filepath = args[0];
  const isJSON = args.includes("--json");
  const isStrict = args.includes("--strict");

  // Verifica esistenza file
  if (!fs.existsSync(filepath)) {
    console.error(`Error: File not found: ${filepath}`);
    process.exit(1);
  }

  // Leggi file
  let content = fs.readFileSync(filepath, "utf-8");
  // Strip BOM if present (common in Windows files)
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // Parse
  const parser = new ISLParser(content);
  const sections = parser.parse();

  // Validate
  const validator = new ISLValidator(sections);
  const result = validator.validate();

  // Strict mode: warnings become errors
  if (isStrict && result.warnings.length > 0) {
    result.errors.push(...result.warnings);
    result.warnings = [];
    result.valid = false;
  }

  // Report
  if (isJSON) {
    Reporter.reportJSON(result);
  } else {
    Reporter.report(result, filepath);
  }

  // Exit code
  process.exit(result.valid ? 0 : 1);
}

// Run only when this file is the CLI entrypoint (not when imported by vitest/tests).
const invokedAsCli =
  typeof process.argv[1] === "string" &&
  /(?:^|[\\/])isl-lint\.(ts|js)$/i.test(process.argv[1]);
if (invokedAsCli) {
  main();
}

export { ISLParser, ISLValidator, Reporter, ValidationResult };
