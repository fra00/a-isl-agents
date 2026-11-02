import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { shouldSkipProjectDir } from "../compile-plan/bin-paths";

/**
 * ISL Builder - Compilatore a due fasi.
 * Fase 1: Analisi dipendenze e ordinamento topologico.
 * Fase 2: Generazione incrementale di interfacce (.ref.md) e contesti di build (.build.md).
 */
export class ISLBuilder {
  private rootDir: string;
  private allFiles: Set<string> = new Set();
  private dependents: Map<string, string[]> = new Map();
  private inDegree: Map<string, number> = new Map();

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  public async build() {
    console.log(`🚀 Starting ISL Build in: ${this.rootDir}`);
    const outputDir = path.join(this.rootDir, "build");

    // 1. Scansione e Analisi
    this.scanDirectory(this.rootDir);

    if (this.allFiles.size === 0) {
      console.error(`⚠️ No .isl.md files found in: ${this.rootDir}`);
      return;
    }

    let buildOrder: string[];
    try {
      this.buildGraph();
      buildOrder = this.getBuildOrder();
      console.log(
        `📋 Build Order: \n${buildOrder.map((f) => `   - ${path.basename(f)}`).join("\n")}`,
      );
    } catch (e: any) {
      console.error(`❌ Build Failed: ${e.message}`);
      return;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifest: any[] = [];

    // 2. Esecuzione Build (Sequenziale)
    for (const filePath of buildOrder) {
      const fileName = path.basename(filePath);
      console.log(`🔨 Building: ${fileName}`);

      const relativePath = path.relative(this.rootDir, filePath);
      const targetDir = path.join(outputDir, path.dirname(relativePath));

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // A. Genera Interfaccia (.ref.md)
      const refContent = this.generateInterface(filePath);
      const refPath = path.join(
        targetDir,
        path.basename(filePath).replace(".isl.md", ".ref.md"),
      );
      fs.writeFileSync(refPath, refContent);
      // console.log(`   -> Generated Interface: ${path.basename(refPath)}`);

      // B. Genera Contesto di Build (.build.md)
      const { content: buildContext, implementationPath } =
        this.generateBuildContext(filePath, outputDir);
      const buildPath = path.join(
        targetDir,
        path.basename(filePath).replace(".isl.md", ".build.md"),
      );
      fs.writeFileSync(buildPath, buildContext);
      // console.log(`   -> Generated Build Context: ${path.basename(buildPath)}`);

      // C. Calcola Hash e aggiorna Manifest
      const hash = crypto.createHash("md5").update(buildContext).digest("hex");
      manifest.push({
        sourceFile: filePath,
        buildFile: buildPath,
        implementationPath: implementationPath,
        hash: hash,
      });
    }

    // Scrivi il manifesto di build
    fs.writeFileSync(
      path.join(outputDir, "build-manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(`✅ Build Completed Successfully. Output in: ${outputDir}`);
  }

  // --- Logica di Grafo (Fase 1) ---

  private scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (shouldSkipProjectDir(entry.name)) {
          continue;
        }
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".isl.md")) {
        this.allFiles.add(fullPath);
        if (!this.dependents.has(fullPath)) this.dependents.set(fullPath, []);
        if (!this.inDegree.has(fullPath)) this.inDegree.set(fullPath, 0);
      }
    }
  }

  private buildGraph(): void {
    const refPattern =
      /^>\s*\*\*Reference\*\*.*(?:\[.*?\]\(([^"\s)]+)(?:\s+".*?")?\)|`([^`]+)`)/;
    for (const file of this.allFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const dirName = path.dirname(file);
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(refPattern);
        if (match) {
          const relPath = match[1] || match[2];
          if (relPath) {
            const dependencyPath = path.resolve(dirName, relPath);
            if (!fs.existsSync(dependencyPath)) {
              throw new Error(
                `Broken reference in ${path.basename(file)} (line ${i + 1}): File not found at '${relPath}'`,
              );
            }
            if (this.allFiles.has(dependencyPath)) {
              this.dependents.get(dependencyPath)?.push(file);
              this.inDegree.set(file, (this.inDegree.get(file) || 0) + 1);
            }
          }
        }
      }
    }
  }

  private getBuildOrder(): string[] {
    const queue: string[] = [];
    const order: string[] = [];
    const inDegreeMap = new Map(this.inDegree); // Clone per non distruggere lo stato

    for (const [file, degree] of inDegreeMap.entries()) {
      if (degree === 0) queue.push(file);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      const neighbors = this.dependents.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegreeMap.get(neighbor) || 0) - 1;
        inDegreeMap.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (order.length !== this.allFiles.size) {
      throw new Error(`Circular dependency detected!`);
    }
    return order;
  }

  // --- Logica di Generazione (Fase 2) ---

  /**
   * Estrae solo le parti pubbliche (Header, Signature, Contract, Constraints)
   * Rimuove i dettagli implementativi (Flow).
   */
  private generateInterface(filePath: string): string {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    const output: string[] = [];

    let skipMode = false;

    output.push(`<!-- INTERFACE (REF) FOR: ${path.basename(filePath)} -->`);

    for (const line of lines) {
      // Extract Implementation Path metadata
      const implMatch = line.match(/^\s*\*\*Implementation\*\*\s*:\s*(.+)$/);
      if (implMatch) {
        output.push(`<!-- IMPLEMENTATION PATH: ${implMatch[1].trim()} -->`);
      }

      // Rileva inizio sezione Flow (da nascondere nel .ref)
      if (line.trim().startsWith("**Flow**:")) {
        skipMode = true;
        continue;
      }

      // Rileva fine sezione Flow (nuova capability o separatore)
      if (skipMode) {
        if (
          line.trim().startsWith("---") ||
          line.trim().startsWith("####") ||
          line.trim().startsWith("## ")
        ) {
          skipMode = false;
        } else {
          continue; // Salta il contenuto del Flow
        }
      }

      output.push(line);
    }

    // Normalizza righe vuote
    return output.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  /**
   * Crea il contesto di compilazione per un file.
   * Include il contenuto dei file .ref.md delle dipendenze dirette.
   */
  private generateBuildContext(
    filePath: string,
    outputDir: string,
  ): { content: string; implementationPath: string | null } {
    const content = fs.readFileSync(filePath, "utf-8");
    const dirName = path.dirname(filePath);
    const output: string[] = [];
    const lines = content.split(/\r?\n/);
    let implementationPath: string | null = null;

    // Header Context Map
    output.push(`<!-- BUILD CONTEXT FOR: ${path.basename(filePath)} -->`);

    for (const line of lines) {
      const implMatch = line.match(/^\s*\*\*Implementation\*\*\s*:\s*(.+)$/);
      if (implMatch) {
        implementationPath = implMatch[1].trim();
        output.push(
          `<!-- TARGET IMPLEMENTATION PATH: ${implementationPath} -->`,
        );
        break;
      }
    }

    if (!implementationPath) {
      console.warn(
        `   ⚠️  Warning: No '**Implementation**: path' found in ${path.basename(filePath)}`,
      );
    }

    output.push(`<!-- Dependencies are included as Interfaces (.ref.md) -->\n`);

    const refPattern =
      /^>\s*\*\*Reference\*\*.*(?:\[.*?\]\(([^"\s)]+)(?:\s+".*?")?\)|`([^`]+)`)/;

    for (const line of lines) {
      const match = line.match(refPattern);
      if (match) {
        const relPath = match[1] || match[2];
        if (relPath) {
          const dependencyPath = path.resolve(dirName, relPath);
          const relativeDepPath = path.relative(this.rootDir, dependencyPath);
          const refPath = path.join(
            outputDir,
            relativeDepPath.replace(".isl.md", ".ref.md"),
          );

          if (fs.existsSync(refPath)) {
            output.push(
              `\n<!-- START DEPENDENCY INTERFACE: ${path.basename(refPath)} -->`,
            );
            output.push(fs.readFileSync(refPath, "utf-8"));
            output.push(`<!-- END DEPENDENCY INTERFACE -->\n`);
          }
        }
      }
    }

    output.push(`\n<!-- SOURCE FILE TO IMPLEMENT -->`);
    output.push(content);

    return {
      content: output.join("\n").replace(/\n{3,}/g, "\n\n"),
      implementationPath,
    };
  }
}

// CLI Execution — only when this file is the entrypoint (not when imported).
const invokedAsCli =
  typeof process.argv[1] === "string" &&
  /(?:^|[\\/])isl-builder\.(ts|js)$/i.test(process.argv[1]);
if (invokedAsCli) {
  const targetDir = process.argv[2] || ".";
  const builder = new ISLBuilder(targetDir);
  builder.build();
}
