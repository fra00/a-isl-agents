import React from "react";
import { createRoot } from "react-dom/client";
import boardRules from "../bin-react-js/board-rules.js";
import aiOpponent from "../bin-react-js/ai-opponent.js";
import { GameService } from "../bin-react-js/game-service.js";
import AppShell from "../bin-react-js/app-shell.jsx";

const rules = boardRules();
const gameService = GameService({ boardRules: rules });
const opponent = aiOpponent({ boardRules: rules });

function Demo() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-950">
        Connect Four — Two players or Single vs PC. Click a column to drop. Four
        in a row wins.
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <AppShell gameService={gameService} aiOpponent={opponent} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Demo />);
