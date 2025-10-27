import { TestEngine } from '../testEngine/TestEngine';

export function renderTestEngine() {
    const content = `
        <div class="w-full h-full overflow-hidden">
            <main class="container mx-auto px-4 py-8">
                <div class="bg-primary dark:bg-primary-dark p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold mb-4">Test Engine - Cube Physics</h1>
                    <div class="mb-4">
                        <h2 class="text-xl font-semibold mb-2">Controls:</h2>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>Movement:</strong></p>
                                <p>W/↑ - Move Up</p>
                                <p>S/↓ - Move Down</p>
                                <p>A/← - Move Left</p>
                                <p>D/→ - Move Right</p>
                            </div>
                            <div>
                                <p><strong>Depth:</strong></p>
                                <p>Q - Move Forward</p>
                                <p>E - Move Backward</p>
                                <p><em>Release keys to stop</em></p>
                            </div>
                        </div>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            This test engine demonstrates server-side physics with client-side interpolation for smooth 60fps rendering.
                            The cube has acceleration, friction, and bounces off walls with energy loss.
                        </p>
                    </div>
                    <div id="gameCanvas" class="w-full h-96 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                        <!-- Game canvas will be inserted here -->
                    </div>
                    <div class="mt-4 text-center">
                        <button id="toggleMode" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                            Switch to Offline Mode
                        </button>
                    </div>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;
        
        const url = new URL(window.location.href);
        const mode = url.searchParams.get('mode') || 'online';
        const gameId = url.searchParams.get('gameId') || undefined;
        
        let testEngine: TestEngine | null = null;
        let currentMode = mode;
        
        const mountEngine = () => {
            if (testEngine) {
                testEngine.unmount();
            }
            
            testEngine = new TestEngine();
            const canvasElement = document.getElementById('gameCanvas') as HTMLElement;
            
            if (currentMode === 'online') {
                testEngine.mount(canvasElement, { online: true, gameId });
            } else {
                testEngine.mount(canvasElement);
            }
        };
        
        // Mount initial engine
        mountEngine();
        
        // Toggle mode button
        const toggleButton = document.getElementById('toggleMode');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                currentMode = currentMode === 'online' ? 'offline' : 'online';
                toggleButton.textContent = currentMode === 'online' ? 'Switch to Offline Mode' : 'Switch to Online Mode';
                mountEngine();
            });
        }

    }
}
