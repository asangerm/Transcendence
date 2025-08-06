export function renderProfile() {
    const content = `
        <div class="min-h-screen">
            <!-- Modal Upload -->
            <div id="uploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-light_white p-6 max-w-md w-full mx-4 transform transition-all duration-300">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">Changer la photo de profil</h3>
                        <button id="closeModal" class="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Drop Zone - Initial State -->
                    <div id="dropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-button transition-colors duration-300">
                        <div class="space-y-4">
                            <div class="mx-auto h-16 w-16 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p class="text-gray-700 mb-2">Glissez votre image ici</p>
                                <p class="text-gray-500 text-sm">ou</p>
                            </div>
                            <button id="browseButton" class="button-primary">
                                Parcourir
                            </button>
                            <input type="file" id="fileInput" class="hidden" accept="image/*">
                        </div>
                        <p class="text-xs text-gray-500 mt-4">
                            Formats acceptés: JPG, PNG, GIF (max. 5MB)
                        </p>
                    </div>

                    <!-- Preview State -->
                    <div id="previewZone" class="hidden">
                        <div class="relative aspect-square mb-4 bg-light_white rounded-lg overflow-hidden">
                            <!-- Image preview container -->
                            <div id="imageContainer" class="absolute inset-0">
                                <img id="previewImage" class="absolute w-full h-full object-cover" src="" alt="Aperçu">
                            </div>

                            <!-- Circular mask indicator -->
                            <div class="absolute inset-0 pointer-events-none">
                                <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <mask id="circleMask">
                                            <rect width="100%" height="100%" fill="white"/>
                                            <circle cx="50%" cy="50%" r="64" fill="black"/>
                                        </mask>
                                    </defs>
                                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.3)" mask="url(#circleMask)"/>
                                </svg>
                                <!-- Circle border indicator -->
                                <div class="absolute left-1/2 top-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2">
                                    <div class="absolute inset-0 rounded-full ring-2 ring-white"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex space-x-4">
                            <button id="cancelPreview" class="flex-1 px-4 py-2 button-secondary">
                                Annuler
                            </button>
                            <button id="confirmUpload" class="flex-1 px-4 py-2 button-primary">
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main class="container mx-auto px-4 py-8">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-primary dark:bg-primary-dark rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-2xl">
                        <h1 class="text-3xl font-bold text-center mb-8">Profil du Joueur</h1>
                        
                        <!-- Profile Info Section -->
                        <div class="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                            <div class="relative group">
                                <div class="w-32 h-32 border border-black rounded-full overflow-hidden transform transition-all duration-300 group-hover:scale-105">
                                    <img src="../../images/profile1.jpg" alt="Profile" class="w-full h-full object-cover" id="profileImage">
                                </div>
                                <button id="editProfileButton" class="absolute border border-black bottom-0 right-0 bg-button dark:bg-button-dark text-button-text dark:text-button-text-dark p-2 rounded-full shadow-lg transform transition-all duration-300 hover:bg-blue-700 hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </div>
                            <div class="flex-1 text-center md:text-left">
                                <h2 class="text-2xl font-bold mb-2">Username</h2>
                                <p class="text-muted dark:text-muted-dark mb-4">Joueur depuis 2024</p>
                                <div class="flex flex-wrap gap-4">
                                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Niveau 1</span>
                                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Débutant</span>
                                </div>
                            </div>
                        </div>

                        <!-- Statistics Section -->
                        <div class="border-t border-muted dark:border-muted-dark pt-8">
                            <h3 class="text-xl font-bold mb-6 text-center">Statistiques de Jeu</h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div class="bg-light_white p-4 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <p class="text-3xl font-bold text-blue-600 text-center">0</p>
                                    <p class="text-gray-600 text-center">Victoires</p>
                                </div>
                                <div class="bg-light_white p-4 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <p class="text-3xl font-bold text-red-600 text-center">0</p>
                                    <p class="text-gray-600 text-center">Défaites</p>
                                </div>
                                <div class="bg-light_white p-4 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <p class="text-3xl font-bold text-purple-600 text-center">0%</p>
                                    <p class="text-gray-600 text-center">Ratio V/D</p>
                                </div>
                                <div class="bg-light_white p-4 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                                    <p class="text-3xl font-bold text-green-600 text-center">0</p>
                                    <p class="text-gray-600 text-center">Parties Jouées</p>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Games Section -->
                        <div class="border-t border-muted dark:border-muted-dark mt-8 pt-8">
                            <h3 class="text-xl font-bold mb-6 text-center">Parties Récentes</h3>
                            <div class="space-y-4">
                                <!-- Empty state for recent games -->
                                <div class="text-center py-8">
                                    <p class="text-muted dark:text-muted-dark">Aucune partie récente</p>
                                    <a href="/games" class="inline-block mt-4 px-6 py-2 button-primary">
                                        Commencer à jouer
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = content;

        // Setup modal functionality
        const modal = document.getElementById('uploadModal');
        const editButton = document.getElementById('editProfileButton');
        const closeButton = document.getElementById('closeModal');
        const dropZone = document.getElementById('dropZone');
        const previewZone = document.getElementById('previewZone');
        const previewImage = document.getElementById('previewImage') as HTMLImageElement;
        const browseButton = document.getElementById('browseButton');
        const fileInput = document.getElementById('fileInput');
        const cancelPreview = document.getElementById('cancelPreview');

        if (modal && editButton && closeButton && dropZone && previewZone && previewImage && 
            browseButton && fileInput && cancelPreview) {
            
            // Open modal
            editButton.addEventListener('click', () => {
                modal.classList.remove('hidden');
                dropZone.classList.remove('hidden');
                previewZone.classList.add('hidden');
            });

            // Close modal and reset
            function resetModal() {
                if (modal && dropZone && previewZone && previewImage) {
                    modal.classList.add('hidden');
                    dropZone.classList.remove('hidden');
                    previewZone.classList.add('hidden');
                    previewImage.src = '';
                    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
                }
            }

            closeButton.addEventListener('click', resetModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) resetModal();
            });

            // Cancel preview
            cancelPreview.addEventListener('click', () => {
                dropZone.classList.remove('hidden');
                previewZone.classList.add('hidden');
                previewImage.src = '';
            });

            // Handle file selection
            const handleFile = (file: File) => {
                if (!file.type.startsWith('image/')) {
                    alert('Veuillez sélectionner une image valide');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('L\'image ne doit pas dépasser 5MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        previewImage.src = e.target.result as string;
                        dropZone.classList.add('hidden');
                        previewZone.classList.remove('hidden');
                    }
                };
                reader.readAsDataURL(file);
            };

            // File input change
            fileInput.addEventListener('change', (e) => {
                const input = e.target as HTMLInputElement;
                if (input.files?.[0]) {
                    handleFile(input.files[0]);
                }
            });

            // Drag and drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('border-blue-500', 'bg-blue-50');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt?.files[0]) {
                    handleFile(dt.files[0]);
                }
            });

            // Trigger file input when clicking browse button
            browseButton.addEventListener('click', () => {
                fileInput.click();
            });
        }
    }
}

// Function to upload the profile image to the server (to be implemented)
/*
async function uploadProfileImage(file: File) {
    try {
        const formData = new FormData();
        formData.append('profile_image', file);

        const response = await fetch('/api/profile/image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        console.log('Image uploaded successfully:', data);
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Erreur lors du téléchargement de l\'image');
    }
}
*/