const imageUpload = document.getElementById('imageUpload');
const fileName = document.getElementById('fileName');
const difficultyLevel = document.getElementById('difficultyLevel');
const showNumbers = document.getElementById('showNumbers');
const generatePuzzleBtn = document.getElementById('generatePuzzle');
const resetPuzzleBtn = document.getElementById('resetPuzzle');
const puzzleContainer = document.getElementById('puzzleContainer');
const puzzleGrid = document.getElementById('puzzleGrid');
const successMessage = document.getElementById('successMessage');
const moveCounter = document.getElementById('moveCounter');
const timerElement = document.getElementById('timer');
const toggleReferenceBtn = document.getElementById('toggleReference');
const originalImageContainer = document.getElementById('originalImageContainer');
const originalImage = document.getElementById('originalImage');

let uploadedImage = null;
let tilesArray = [];
let gridSize = 4;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let selectedTile = null;
let puzzleSolved = false;
let originalImageData = null;

imageUpload.addEventListener('change', handleImageUpload);
generatePuzzleBtn.addEventListener('click', generatePuzzle);
resetPuzzleBtn.addEventListener('click', resetPuzzle);
difficultyLevel.addEventListener('change', () => {
    gridSize = parseInt(difficultyLevel.value);
});
toggleReferenceBtn.addEventListener('click', toggleReferenceImage);

function handleImageUpload(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        fileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedImage = new Image();
            uploadedImage.onload = function() {
                generatePuzzleBtn.disabled = false;
                originalImage.src = event.target.result;
                originalImageData = event.target.result;
            };
            uploadedImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function generatePuzzle() {
    if (!uploadedImage) return;
    resetGameState();
    const maxSize = Math.min(window.innerWidth - 40, 500);
    const puzzleSize = Math.min(uploadedImage.width, uploadedImage.height, maxSize);
    puzzleContainer.style.width = `${puzzleSize}px`;
    puzzleContainer.style.height = `${puzzleSize}px`;
    puzzleGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzleGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    puzzleGrid.style.width = `${puzzleSize}px`;
    puzzleGrid.style.height = `${puzzleSize}px`;
    puzzleGrid.innerHTML = '';
    tilesArray = [];
    const canvas = document.createElement('canvas');
    const tileSize = puzzleSize / gridSize;
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const index = y * gridSize + x;
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.dataset.correctX = x;
            tile.dataset.correctY = y;
            tile.dataset.index = index;
            ctx.clearRect(0, 0, tileSize, tileSize);
            const sourceX = (uploadedImage.width / gridSize) * x;
            const sourceY = (uploadedImage.height / gridSize) * y;
            const sourceWidth = uploadedImage.width / gridSize;
            const sourceHeight = uploadedImage.height / gridSize;
            ctx.drawImage(
                uploadedImage,
                sourceX, sourceY,
                sourceWidth, sourceHeight,
                0, 0,
                tileSize, tileSize
            );
            const imageUrl = canvas.toDataURL();
            tile.style.backgroundImage = `url(${imageUrl})`;
            tile.style.width = `${tileSize}px`;
            tile.style.height = `${tileSize}px`;
            if (showNumbers.checked) {
                const tileNumber = document.createElement('div');
                tileNumber.classList.add('tile-number');
                tileNumber.textContent = index + 1;
                tile.appendChild(tileNumber);
            }
            tile.addEventListener('click', () => handleTileClick(tile));
            tilesArray.push(tile);
        }
    }
    shuffleTiles();
    tilesArray.forEach(tile => {
        puzzleGrid.appendChild(tile);
    });
    startTimer();
    resetPuzzleBtn.disabled = false;
}

function shuffleTiles() {
    for (let i = tilesArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tilesArray[i], tilesArray[j]] = [tilesArray[j], tilesArray[i]];
        const currentI = parseInt(tilesArray[i].dataset.index);
        const currentJ = parseInt(tilesArray[j].dataset.index);
        tilesArray[i].dataset.index = currentJ;
        tilesArray[j].dataset.index = currentI;
    }
}

function handleTileClick(tile) {
    if (puzzleSolved) return;
    if (selectedTile === null) {
        selectedTile = tile;
        tile.classList.add('selected');
    } else {
        if (selectedTile !== tile) {
            const tempIndex = selectedTile.dataset.index;
            selectedTile.dataset.index = tile.dataset.index;
            tile.dataset.index = tempIndex;
            const index1 = tilesArray.indexOf(selectedTile);
            const index2 = tilesArray.indexOf(tile);
            [tilesArray[index1], tilesArray[index2]] = [tilesArray[index2], tilesArray[index1]];
            const parent = puzzleGrid;
            parent.insertBefore(selectedTile, tile);
            parent.insertBefore(tile, selectedTile.nextSibling);
            moves++;
            moveCounter.textContent = `Moves: ${moves}`;
            checkSolution();
        }
        selectedTile.classList.remove('selected');
        selectedTile = null;
    }
}

function checkSolution() {
    let solved = true;
    for (let i = 0; i < tilesArray.length; i++) {
        const correctX = parseInt(tilesArray[i].dataset.correctX);
        const correctY = parseInt(tilesArray[i].dataset.correctY);
        const correctIndex = correctY * gridSize + correctX;
        const currentIndex = parseInt(tilesArray[i].dataset.index);
        if (correctIndex !== currentIndex) {
            solved = false;
            break;
        }
    }
    if (solved) {
        puzzleSolved = true;
        clearInterval(timerInterval);
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    seconds = 0;
    timerElement.textContent = 'Time: 00:00';
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function resetPuzzle() {
    if (!uploadedImage) return;
    resetGameState();
    generatePuzzle();
}

function resetGameState() {
    puzzleSolved = false;
    moves = 0;
    seconds = 0;
    selectedTile = null;
    moveCounter.textContent = 'Moves: 0';
    successMessage.style.display = 'none';
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function toggleReferenceImage() {
    originalImageContainer.classList.toggle('visible');
    if (originalImageContainer.classList.contains('visible')) {
        toggleReferenceBtn.textContent = 'Hide Reference Image';
    } else {
        toggleReferenceBtn.textContent = 'Show Reference Image';
    }
}

window.addEventListener('resize', () => {
    if (uploadedImage) {
        const maxSize = Math.min(window.innerWidth - 40, 500);
        const puzzleSize = Math.min(uploadedImage.width, uploadedImage.height, maxSize);
        puzzleContainer.style.width = `${puzzleSize}px`;
        puzzleContainer.style.height = `${puzzleSize}px`;
        puzzleGrid.style.width = `${puzzleSize}px`;
        puzzleGrid.style.height = `${puzzleSize}px`;
    }
});
