import { PongGame } from "../scripts/pong/pong";

export function renderPong() {
  const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Pong Game</h1>

                    <!-- AI Controls -->
                    <div class="mb-4 p-4 bg-gray-800 rounded-lg">
                        <h2 class="text-xl font-bold mb-2">AI Controls</h2>
                        <div class="flex flex-wrap gap-4 items-center mb-3">
                            <button id="enableAITop" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
                                Enable AI (Top)
                            </button>
                            <button id="enableAIBottom" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                                Enable AI (Bottom)
                            </button>
                            <button id="disableAI" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
                                Disable AI
                            </button>
                            <select id="aiDifficulty" class="px-4 py-2 bg-gray-700 rounded">
                                <option value="easy">Easy</option>
                                <option value="medium" selected>Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <p class="text-sm text-gray-400 mt-2">
                            Controls: Top (O/L keys), Bottom (R/F keys)
                        </p>
                    </div>

                    <div id="gameCanvas" class="w-full h-96 rounded-lg">
                        <!-- Game canvas will be inserted here -->
                    </div>
                </div>
            </main>
        </div>
    `;

  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = content;

    // Initialize game
    const pongGame = new PongGame();
    pongGame.mount(document.getElementById("gameCanvas") as HTMLElement);

    // Setup AI controls
    const enableAITopBtn = document.getElementById("enableAITop");
    const enableAIBottomBtn = document.getElementById("enableAIBottom");
    const disableAIBtn = document.getElementById("disableAI");
    const difficultySelect = document.getElementById(
      "aiDifficulty"
    ) as HTMLSelectElement;

    enableAITopBtn?.addEventListener("click", () => {
      const difficulty = difficultySelect.value as "easy" | "medium" | "hard";
      pongGame.enableAI("top", difficulty);
    });

    enableAIBottomBtn?.addEventListener("click", () => {
      const difficulty = difficultySelect.value as "easy" | "medium" | "hard";
      pongGame.enableAI("bottom", difficulty);
    });

    disableAIBtn?.addEventListener("click", () => {
      pongGame.disableAI();
    });
  }
}
