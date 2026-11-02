export interface ManifestEntry {
  sourceFile: string;
  buildFile: string;
  implementationPath: string | null;
  hash: string;
}

export interface GenLock {
  [buildFile: string]: string; // Mappa buildFile -> hash dell'ultima generazione
}