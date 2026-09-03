// ============================================================
//  TOWERS OF HANOI - Pure JavaScript Version
//  No React, no JSX, just vanilla JS
// ============================================================

// -------- DOM References --------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const difficultyScreen = document.getElementById('difficulty-screen');
const gameScreen = document.getElementById('game-screen');
const difficultyLabel = document.getElementById('difficulty-label');
const progressLabel = document.getElementById('progress-label');
const movesDisplay = document.getElementById('movesDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const bestTimeDisplay = document.getElementById('bestTimeDisplay');
const bestTimeEasy = document.getElementById('bestTimeEasy');
const bestTimeMedium = document.getElementById('bestTimeMedium');
const bestTimeHard = document.getElementById('bestTimeHard');
const messagesContainer = document.getElementById('messages-container');
const winOverlay = document.getElementById('win-overlay');
const winMessage = document.getElementById('winMessage');
const bestTimeMessage = document.getElementById('bestTimeMessage');
const undoBtn = document.getElementById('undoBtn');
const newGameBtn = document.getElementById('newGameBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const winPlayAgain = document.getElementById('winPlayAgain');
const winClose = document.getElementById('winClose');

// -------- Difficulty settings --------
const DIFFICULTIES = {
    easy: { label: 'Easy', disks: 3, icon: '🟢' },
    medium: { label: 'Medium', disks: 4, icon: '🟡' },
    hard: { label: 'Hard', disks: 5, icon: '🔴' }
};

// -------- Motivational messages --------
const PROGRESS_MESSAGES = {
    1: ['🌟 Great start! One disk in place!', '🎯 You\'re on your way to victory!', '💪 Excellent first step!'],
    2: ['🎉 You\'re making progress! 2 disks in place!', '🌟 Halfway there! Keep going!', '💪 Fantastic! You\'ve got this!'],
    3: ['🔥 You\'re on fire! 3 disks in place!', '🎯 Almost there! Just a few more!', '💪 Amazing work! Don\'t stop now!'],
    4: ['🌟 Incredible! Only 1 disk to go!', '🎯 You\'re so close! Keep it up!', '💪 Almost there! You can do this!']
};

// -------- Game state --------
let currentDifficulty = null;
let numDisks = 3;
let rods = { A: [], B: [], C: [] };
let selectedDisk = null;
let startTime = null;
let bestTimes = { easy: null, medium: null, hard: null };
let moves = 0;
let moveHistory = [];
let won = false;
let previousCompleted = 0;
let messages = [];
let timerInterval = null;
let diskAnimation = null;
let dragState = null;

// -------- Load best times --------
function loadBestTimes() {
    const stored = localStorage.getItem('hanoiBestTimes');
    if (stored) {
        try {
            bestTimes = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse best times');
        }
    }
    updateBestTimesDisplay();
}

// -------- Save best times --------
function saveBestTimes() {
    localStorage.setItem('hanoiBestTimes', JSON.stringify(bestTimes));
    updateBestTimesDisplay();
}

// -------- Update best times display --------
function updateBestTimesDisplay() {
    bestTimeEasy.textContent = bestTimes.easy ? bestTimes.easy.toFixed(2) + 's' : '—';
    bestTimeMedium.textContent = bestTimes.medium ? bestTimes.medium.toFixed(2) + 's' : '—';
    bestTimeHard.textContent = bestTimes.hard ? bestTimes.hard.toFixed(2) + 's' : '—';
}

// -------- Get random message --------
function getRandomMessage(progress) {
    const msgs = PROGRESS_MESSAGES[progress];
    if (!msgs) return `🎯 ${progress}/5 disks in place!`;
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// -------- Add progress message --------
function addProgressMessage(progress) {
    const message = getRandomMessage(progress);
    const time = new Date().toLocaleTimeString();
    const icon = ['🌟', '🎯', '💪', '🔥'][progress - 1] || '🎯';
    
    messages.push({ text: message, icon, time });
    renderMessages();
}

// -------- Render messages --------
function renderMessages() {
    messagesContainer.innerHTML = '';
    messages.forEach((msg) => {
        const div = document.createElement('div');
        div.className = 'progress-message-item';
        div.innerHTML = `
            <span class="message-icon">${msg.icon}</span>
            ${msg.text}
            <span class="message-time">${msg.time}</span>
        `;
        messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// -------- Count correct disks --------
function countCorrectDisks() {
    const cRod = rods.C;
    let count = 0;
    for (let i = 0; i < cRod.length; i++) {
        if (cRod[i] === numDisks - i) {
            count++;
        } else {
            break;
        }
    }
    return count;
}

// -------- Check win --------
function checkWin() {
    if (rods.C.length === numDisks) {
        won = true;
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (!bestTimes[currentDifficulty] || elapsed < bestTimes[currentDifficulty]) {
            bestTimes[currentDifficulty] = elapsed;
            saveBestTimes();
        }
        
        winMessage.textContent = `You solved the puzzle in ${moves} moves and ${elapsed.toFixed(2)} seconds!`;
        if (bestTimes[currentDifficulty]) {
            bestTimeMessage.textContent = `🏆 Fastest ${DIFFICULTIES[currentDifficulty].label} time: ${bestTimes[currentDifficulty].toFixed(2)} seconds!`;
        }
        winOverlay.style.display = 'flex';
        dropConfetti();
        updateDisplay();
        return true;
    }
    return false;
}

// -------- Move disk --------
function moveDisk(fromRod, toRod) {
    if (!rods[fromRod].length) return false;
    const disk = rods[fromRod][rods[fromRod].length - 1];
    if (!rods[toRod].length || rods[toRod][rods[toRod].length - 1] > disk) {
        const newRods = JSON.parse(JSON.stringify(rods));
        newRods[fromRod].pop();
        newRods[toRod].push(disk);
        rods = newRods;
        moveHistory.push(JSON.parse(JSON.stringify(rods)));
        moves++;
        
        const correct = countCorrectDisks();
        if (correct > previousCompleted && correct < numDisks) {
            previousCompleted = correct;
            addProgressMessage(correct);
        }
        
        const targetY = 370 - rods[toRod].length * 22;
        drawRods();
        animateDisk(toRod, disk, 38, targetY, () => {
            checkWin();
            updateDisplay();
        });
        updateDisplay();
        return true;
    }
    return false;
}

// -------- Handle disk click --------
function handleDiskClick(rod) {
    if (won || diskAnimation || dragState || !rods[rod].length) return;
    selectedDisk = { rod, disk: rods[rod][rods[rod].length - 1] };
    drawRods();
    const startY = 370 - rods[rod].length * 22;
    animateDisk(rod, selectedDisk.disk, startY, 38);
}

// -------- Canvas click handler --------
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const rod = getRod(x);
    if (rod) handleDiskClick(rod);
}

// -------- Touch handler --------
function handleTouchStart(e) {
    e.preventDefault();
}

function getPointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * 600 / rect.width,
        y: (e.clientY - rect.top) * 400 / rect.height
    };
}

function handlePointerDown(e) {
    if (won || diskAnimation || dragState) return;
    const position = getPointerPosition(e);
    const rod = getRod(position.x);
    if (!rod || !rods[rod].length) return;

    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const disk = rods[rod][rods[rod].length - 1];
    dragState = { rod, disk, x: position.x, y: 370 - rods[rod].length * 22 };
    selectedDisk = { rod, disk };
    animateDisk(rod, disk, dragState.y, 38);
}

function handlePointerMove(e) {
    if (!dragState) return;
    e.preventDefault();
    dragState.x = Math.max(20, Math.min(580, getPointerPosition(e).x));
    dragState.y = 38;
    drawRods();
}

function finishDrag(e) {
    if (!dragState) return;
    e.preventDefault();
    const fromRod = dragState.rod;
    const position = getPointerPosition(e);
    const toRod = getRod(position.x);
    dragState = null;
    selectedDisk = null;
    if (toRod && toRod !== fromRod) moveDisk(fromRod, toRod);
    else drawRods();
}

// -------- Get rod from x position --------
function getRod(x) {
    if (90 <= x && x <= 210) return 'A';
    if (240 <= x && x <= 360) return 'B';
    if (390 <= x && x <= 510) return 'C';
    return null;
}

// ============================================================
//  3D DRAWING WITH REALISTIC RODS AND RINGS
// ============================================================

function drawRods() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 400 * dpr;
    canvas.style.width = '600px';
    canvas.style.height = '400px';
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, 600, 400);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 400);

    // Base
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    const baseGrad = ctx.createLinearGradient(0, 370, 0, 390);
    baseGrad.addColorStop(0, '#8B7355');
    baseGrad.addColorStop(0.5, '#A0845C');
    baseGrad.addColorStop(1, '#6B5340');
    ctx.fillStyle = baseGrad;
    ctx.shadowBlur = 15;
    roundRect(ctx, 20, 370, 560, 20, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    const rodPositions = { A: 150, B: 300, C: 450 };
    const rodHeight = 300;
    const rodWidth = 12;

    Object.keys(rodPositions).forEach((rod) => {
        const x = rodPositions[rod];
        
        // Draw 3D rod
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const rodGrad = ctx.createLinearGradient(x - rodWidth/2, 0, x + rodWidth/2, 0);
        rodGrad.addColorStop(0, '#8a8a8a');
        rodGrad.addColorStop(0.3, '#d4d4d4');
        rodGrad.addColorStop(0.5, '#f0f0f0');
        rodGrad.addColorStop(0.7, '#d4d4d4');
        rodGrad.addColorStop(1, '#8a8a8a');
        
        ctx.fillStyle = rodGrad;
        ctx.shadowBlur = 8;
        roundRect(ctx, x - rodWidth/2, 60, rodWidth, rodHeight, 4);
        ctx.fill();
        
        // Rod highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        roundRect(ctx, x - rodWidth/4, 65, rodWidth/3, rodHeight - 10, 2);
        ctx.fill();

        // Draw disks
        const rodDisks = rods[rod] || [];
        rodDisks.forEach((disk, i) => {
            if ((diskAnimation && diskAnimation.rod === rod && diskAnimation.disk === disk) ||
                (dragState && dragState.rod === rod && dragState.disk === disk)) return;
            const diskHeight = 22;
            const maxDiskWidth = 80;
            const diskWidth = 20 + (disk / numDisks) * (maxDiskWidth - 20);
            const yPos = 370 - (i + 1) * diskHeight;
            
            const hue = ((disk - 1) / (numDisks - 1)) * 240 + 20;
            const lightness = 50 + (disk / numDisks) * 10;
            
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 3;
            
            const diskGrad = ctx.createRadialGradient(
                x - diskWidth/4, yPos + diskHeight/4, diskWidth * 0.1,
                x, yPos + diskHeight/2, diskWidth * 0.6
            );
            
            const lightColor = `hsl(${hue}, 90%, ${lightness + 20}%)`;
            const midColor = `hsl(${hue}, 85%, ${lightness}%)`;
            const darkColor = `hsl(${hue}, 80%, ${lightness - 25}%)`;
            
            diskGrad.addColorStop(0, lightColor);
            diskGrad.addColorStop(0.5, midColor);
            diskGrad.addColorStop(1, darkColor);
            
            ctx.fillStyle = diskGrad;
            
            const cx = x - diskWidth/2;
            const cy = yPos;
            const cw = diskWidth;
            const ch = diskHeight;
            const radius = 6;
            
            roundRect(ctx, cx, cy, cw, ch, radius);
            ctx.fill();
            
            // Highlight
            ctx.shadowBlur = 0;
            const highlightGrad = ctx.createLinearGradient(
                x - diskWidth/2, yPos,
                x - diskWidth/2, yPos + diskHeight/2
            );
            highlightGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
            highlightGrad.addColorStop(0.3, 'rgba(255,255,255,0.1)');
            highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
            
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.moveTo(x - diskWidth/2 + radius, yPos + 2);
            ctx.lineTo(x + diskWidth/2 - radius, yPos + 2);
            ctx.quadraticCurveTo(x + diskWidth/2, yPos + 2, x + diskWidth/2, yPos + 2 + radius);
            ctx.lineTo(x + diskWidth/2, yPos + diskHeight/2 - 2);
            ctx.lineTo(x - diskWidth/2, yPos + diskHeight/2 - 2);
            ctx.lineTo(x - diskWidth/2, yPos + 2 + radius);
            ctx.quadraticCurveTo(x - diskWidth/2, yPos + 2, x - diskWidth/2 + radius, yPos + 2);
            ctx.closePath();
            ctx.fill();
            
            // Border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `hsla(${hue}, 80%, ${lightness - 30}%, 0.3)`;
            ctx.lineWidth = 0.5;
            roundRect(ctx, cx, cy, cw, ch, radius);
            ctx.stroke();
        });
    });

    if (dragState) {
        drawAnimatedDisk(dragState.rod, dragState.disk, dragState.y, dragState.x);
    } else if (diskAnimation) {
        drawAnimatedDisk(diskAnimation.rod, diskAnimation.disk, diskAnimation.y);
    }

    // Selected disk indicator
    if (selectedDisk && !dragState) {
        const x = rodPositions[selectedDisk.rod];
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, 60, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Labels
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    Object.keys(rodPositions).forEach((rod) => {
        ctx.fillText(rod, rodPositions[rod], 395);
    });

    // Instructions
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    ctx.fillText('Click a rod to select a disk, then click another rod to move it', 300, 30);
}

function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}

function drawAnimatedDisk(rod, disk, yPos, positionX) {
    const x = positionX || { A: 150, B: 300, C: 450 }[rod];
    const diskHeight = 22;
    const diskWidth = 20 + (disk / numDisks) * 60;
    const hue = ((disk - 1) / (numDisks - 1)) * 240 + 20;
    const lightness = 50 + (disk / numDisks) * 10;
    const gradient = ctx.createLinearGradient(x, yPos, x, yPos + diskHeight);

    gradient.addColorStop(0, `hsl(${hue}, 90%, ${lightness + 20}%)`);
    gradient.addColorStop(0.5, `hsl(${hue}, 85%, ${lightness}%)`);
    gradient.addColorStop(1, `hsl(${hue}, 80%, ${lightness - 25}%)`);
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, x - diskWidth / 2, yPos, diskWidth, diskHeight, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function animateDisk(rod, disk, startY, endY, onComplete) {
    const startedAt = performance.now();
    const duration = 320;
    diskAnimation = { rod, disk, y: startY };

    function frame(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        diskAnimation.y = startY + (endY - startY) * eased;
        if (dragState && dragState.rod === rod && dragState.disk === disk) {
            dragState.y = diskAnimation.y;
        }
        drawRods();
        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            diskAnimation = null;
            drawRods();
            if (onComplete) onComplete();
        }
    }

    requestAnimationFrame(frame);
}

function updateDisplay() {
    const completed = countCorrectDisks();
    progressLabel.textContent = `Progress: ${completed}/${numDisks}`;
    movesDisplay.textContent = moves;
    bestTimeDisplay.textContent = bestTimes[currentDifficulty]
        ? `${bestTimes[currentDifficulty].toFixed(2)}s`
        : '—';
    undoBtn.disabled = moveHistory.length === 0 || won;
    if (startTime && !won) {
        timeDisplay.textContent = ((Date.now() - startTime) / 1000).toFixed(1);
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function startTimer() {
    stopTimer();
    timerInterval = setInterval(updateDisplay, 100);
}

function startGame(level) {
    const difficulty = DIFFICULTIES[level];
    if (!difficulty) return;

    currentDifficulty = level;
    numDisks = difficulty.disks;
    difficultyLabel.textContent = `${difficulty.icon} ${difficulty.label}`;
    difficultyScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    document.body.classList.add('game-active');
    resetGame();
}

function resetGame() {
    stopTimer();
    rods = { A: [], B: [], C: [] };
    for (let disk = numDisks; disk >= 1; disk--) rods.A.push(disk);
    selectedDisk = null;
    dragState = null;
    diskAnimation = null;
    startTime = Date.now();
    moves = 0;
    moveHistory = [];
    won = false;
    previousCompleted = 0;
    messages = [];
    renderMessages();
    winOverlay.style.display = 'none';
    timeDisplay.textContent = '0.0';
    drawRods();
    updateDisplay();
    startTimer();
}

function undoMove() {
    if (!moveHistory.length || won) return;
    rods = moveHistory.pop();
    moves = Math.max(0, moves - 1);
    selectedDisk = null;
    previousCompleted = countCorrectDisks();
    drawRods();
    updateDisplay();
}

document.querySelectorAll('.difficulty-btn').forEach((button) => {
    button.addEventListener('click', () => startGame(button.dataset.level));
});

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', finishDrag);
canvas.addEventListener('pointercancel', finishDrag);
undoBtn.addEventListener('click', undoMove);
newGameBtn.addEventListener('click', resetGame);
backToMenuBtn.addEventListener('click', () => {
    stopTimer();
    gameScreen.style.display = 'none';
    difficultyScreen.style.display = 'flex';
    document.body.classList.remove('game-active');
});
winPlayAgain.addEventListener('click', resetGame);
winClose.addEventListener('click', () => {
    winOverlay.style.display = 'none';
});

loadBestTimes();