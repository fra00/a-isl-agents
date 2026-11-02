import React from "react";
import { createRoot } from "react-dom/client";
import { SheetStore } from "../bin-react-js/sheet-store.js";
import AppShell from "../bin-react-js/app-shell.jsx";

const sheetStore = SheetStore({ rows: 20, cols: 8 });

function Demo() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-950">
        Click a cell, type in the formula bar, press Enter. Try{" "}
        <span className="font-mono">A1=10</span>,{" "}
        <span className="font-mono">B1==A1*2</span>, then a cycle{" "}
        <span className="font-mono">A1==B1</span> /{" "}
        <span className="font-mono">B1==A1</span>.
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AppShell sheetStore={sheetStore} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
