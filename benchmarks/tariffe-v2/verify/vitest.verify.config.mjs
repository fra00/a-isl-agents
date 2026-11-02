import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.join(root, "..");

export default defineConfig({
  root: workspace,
  test: {
    environment: "node",
    include: ["bin-react-js/**/*.test.js"],
  },
});
