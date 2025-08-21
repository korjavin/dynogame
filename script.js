const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const infoOverlay = document.getElementById('info-overlay');
const scoreElement = document.getElementById('score');

// Telegram WebApp integration
let isTelegramApp = false;
let telegramUser = null;
let leaderboardData = [];
let leaderboardTimeout = null;

// Initialize Telegram WebApp
function initTelegramApp() {
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initData) {
            Telegram.WebApp.ready();
            telegramUser = Telegram.WebApp.initDataUnsafe.user;
            
            // Only proceed if we have a valid user and CloudStorage is supported
            if (telegramUser && Telegram.WebApp.CloudStorage) {
                isTelegramApp = true;
                
                // Expand the app to full height
                Telegram.WebApp.expand();
                
                // Set main button if needed
                Telegram.WebApp.MainButton.hide();
                
                console.log('Telegram WebApp initialized successfully', telegramUser);
                loadLeaderboard();
                
                // Show Telegram-specific UI elements
                const telegramInfo = document.getElementById('telegram-info');
                if (telegramInfo) {
                    telegramInfo.style.display = 'block';
                }
            } else {
                console.log('Telegram WebApp detected but user not authorized or CloudStorage not available');
            }
        } else {
            console.log('Running outside Telegram - normal browser mode');
        }
    } catch (error) {
        console.log('Telegram WebApp initialization failed:', error.message);
        isTelegramApp = false;
    }
}

// Leaderboard functions
function saveScore(score) {
    if (!isTelegramApp || !telegramUser || !Telegram.WebApp.CloudStorage) return;
    
    try {
        const playerKey = `player_${telegramUser.id}`;
        const playerData = {
            id: telegramUser.id,
            firstName: telegramUser.first_name || 'Player',
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            score: score,
            timestamp: Date.now()
        };
        
        // Get current player best score
        Telegram.WebApp.CloudStorage.getItem(playerKey, (error, value) => {
            if (!error) {
                const currentBest = value ? JSON.parse(value) : null;
                if (!currentBest || score > currentBest.score) {
                    // Save new best score
                    Telegram.WebApp.CloudStorage.setItem(playerKey, JSON.stringify(playerData), (error) => {
                        if (!error) {
                            console.log('Score saved successfully');
                            updateLeaderboard(playerData);
                        } else {
                            console.log('Failed to save score:', error);
                        }
                    });
                }
            } else {
                console.log('Failed to get current score:', error);
            }
        });
    } catch (error) {
        console.log('Error in saveScore:', error.message);
    }
}

function loadLeaderboard() {
    if (!isTelegramApp || !Telegram.WebApp.CloudStorage) return;
    
    try {
        // Get leaderboard data
        Telegram.WebApp.CloudStorage.getItem('leaderboard', (error, value) => {
            if (!error && value) {
                leaderboardData = JSON.parse(value);
                leaderboardData.sort((a, b) => b.score - a.score);
                leaderboardData = leaderboardData.slice(0, 10); // Keep only top 10
                console.log('Leaderboard loaded:', leaderboardData.length, 'players');
            } else if (error) {
                console.log('Failed to load leaderboard:', error);
            }
        });
    } catch (error) {
        console.log('Error in loadLeaderboard:', error.message);
    }
}

function updateLeaderboard(newPlayerData) {
    if (!isTelegramApp || !Telegram.WebApp.CloudStorage) return;
    
    try {
        // Remove existing entry for this player
        leaderboardData = leaderboardData.filter(player => player.id !== newPlayerData.id);
        
        // Add new entry
        leaderboardData.push(newPlayerData);
        
        // Sort by score (highest first)
        leaderboardData.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        leaderboardData = leaderboardData.slice(0, 10);
        
        // Save back to cloud storage
        Telegram.WebApp.CloudStorage.setItem('leaderboard', JSON.stringify(leaderboardData), (error) => {
            if (!error) {
                console.log('Leaderboard updated successfully');
            } else {
                console.log('Failed to update leaderboard:', error);
            }
        });
    } catch (error) {
        console.log('Error in updateLeaderboard:', error.message);
    }
}

function showLeaderboard() {
    const overlay = document.getElementById('leaderboard-overlay');
    const list = document.getElementById('leaderboard-list');
    
    if (leaderboardData.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #9ca3af;">No scores yet!</p>';
    } else {
        let html = '';
        leaderboardData.forEach((player, index) => {
            const displayName = player.firstName + (player.lastName ? ` ${player.lastName}` : '');
            const trophy = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151;">
                    <span>${trophy} ${displayName}</span>
                    <span style="font-weight: bold;">${player.score}</span>
                </div>
            `;
        });
        list.innerHTML = html;
    }
    
    overlay.style.display = 'flex';
}

function hideLeaderboard() {
    const overlay = document.getElementById('leaderboard-overlay');
    overlay.style.display = 'none';
}

function shareLeaderboard() {
    if (!isTelegramApp || !Telegram.WebApp) return;
    
    // Get current player's score for the share message
    let playerScore = 0;
    if (telegramUser && leaderboardData.length > 0) {
        const currentPlayer = leaderboardData.find(player => player.id === telegramUser.id);
        if (currentPlayer) {
            playerScore = currentPlayer.score;
        }
    }
    
    // Detect bot name from various sources
    let botName = 'dynogamebot'; // fallback
    
    // Method 1: Try to extract from current URL
    const currentUrl = window.location.href;
    const urlMatch = currentUrl.match(/t\.me\/([^\/]+)/);
    if (urlMatch) {
        botName = urlMatch[1];
    } else {
        // Method 2: Try to extract from document.referrer if available
        const referrer = document.referrer;
        const referrerMatch = referrer.match(/t\.me\/([^\/]+)/);
        if (referrerMatch) {
            botName = referrerMatch[1];
        } else {
            // Method 3: Check if there's bot info in Telegram.WebApp data
            if (Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.hash) {
                // Try to get bot info from the WebApp environment
                // This might not always work, but we can try
                console.log('Telegram WebApp data:', Telegram.WebApp.initDataUnsafe);
            }
        }
    }
    
    // Create share text
    const textToSend = playerScore > 0 
        ? `Привет! Оцени мой результат в игре Captain Underpants: ${playerScore} очков! 🎮`
        : 'Привет! Попробуй сыграть в Captain Underpants! 🎮';
    
    // Create share URL
    const urlToShare = `https://t.me/${botName}/play`;
    
    // Create Telegram share URL
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(textToSend)}`;
    
    // Open share dialog
    Telegram.WebApp.openTelegramLink(shareUrl);
}

// --- Game Configuration ---
let gameWidth = window.innerWidth > 800 ? 800 : window.innerWidth * 0.9;
let gameHeight = window.innerHeight > 600 ? 600 : window.innerHeight * 0.8;
canvas.width = gameWidth;
canvas.height = gameHeight;

const GRAVITY = 0.8;
let GROUND_HEIGHT = gameHeight * 0.85;
let gameSpeed = 5;
let score = 0;
let isGameOver = true;

// --- Explosion Particles ---
let particles = [];
const PARTICLE_COUNT = 30;

// --- Background Elements for Active Gameplay ---
let backgroundElements = [];

// Element types with their properties
const elementTypes = {
    building: {
        minWidth: 40,
        maxWidth: 100,
        minHeight: 80,
        maxHeight: 200,
        draw: drawBuilding
    },
    tree: {
        minWidth: 30,
        maxWidth: 50,
        minHeight: 70,
        maxHeight: 120,
        draw: drawTree
    },
    cactus: {
        minWidth: 20,
        maxWidth: 30,
        minHeight: 40,
        maxHeight: 80,
        draw: drawCactus
    }
};

function createExplosion(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 8 + 3,
            color: ['#e63946', '#f1c27d', 'white'][Math.floor(Math.random() * 3)],
            life: 60 // lifespan in frames
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.4; // Particle gravity
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// --- Player (Captain Underpants) ---
// --- CAPE PHYSICS ---
// Cape angle (radians), 0 = straight back, positive = up, negative = down
let capeAngle = 0;
let capeAngleTarget = 0;
let capeAngleVel = 0;
const CAPE_ANGLE_DAMPING = 0.15;
const CAPE_ANGLE_SPEED = 0.12;
const CAPE_ANGLE_MAX = Math.PI / 2.2; // max upward
const CAPE_ANGLE_MIN = -Math.PI / 3; // max downward

const player = {
    x: 50,
    y: GROUND_HEIGHT,
    width: 50,
    height: 80,
    originalHeight: 80, // Store original height
    velocityY: 0,
    isJumping: false,
    isDucking: false,  // Add ducking state
    crashed: false,
    _capeDuckTimer: 0, // Cape duck timer
    
    draw() {
        if (this.crashed) return;

        ctx.save();
        // Position the character
        ctx.translate(this.x + this.width / 2, this.y);

        // Define character colors for easy access
        const skinTone = '#f2d5b0';
        const capeRed = '#e63946';
        const pantsWhite = '#ffffff';
        const outlineBlack = '#000000';
        const hairBrown = '#5c3a21';
        const mouthDark = '#5c2727';

        // Base height for drawing, changes when ducking
        let h = this.height;
        let w = this.width;

        // --- Drawing Logic ---
        ctx.lineWidth = 3;
        ctx.strokeStyle = outlineBlack;

        // 1. CAPE (drawn first to be behind the body)
        ctx.save();
        ctx.fillStyle = capeRed;
        ctx.strokeStyle = outlineBlack;
        // Cape anchor point (shoulders)
        ctx.translate(w / 2, -h * 0.9);
        // Cape physics: swing angle
        ctx.rotate(capeAngle);
        ctx.beginPath();
        // Cape shape: a flowing triangle with a curve
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-w * 0.7, h * 0.2, -w * 0.7, h * 0.7);
        ctx.quadraticCurveTo(-w * 0.2, h * 0.8, 0, h * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 2. BODY
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        // Create a rounded body shape
        ctx.roundRect(w * 0.1, -h * 0.75, w * 0.8, h * 0.4, 15);
        ctx.fill();
        ctx.stroke();
        
        // 3. UNDERPANTS
        ctx.fillStyle = pantsWhite;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.4);
        ctx.lineTo(w * 0.9, -h * 0.4);
        ctx.lineTo(w * 0.7, -h * 0.1);
        ctx.lineTo(w * 0.3, -h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Red waistband
        ctx.fillStyle = capeRed;
        ctx.beginPath();
        ctx.rect(w * 0.1, -h * 0.42, w * 0.8, h * 0.05);
        ctx.fill();
        ctx.stroke();

        // 4. HEAD
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        // A rounded rectangle makes a much better cartoony head
        ctx.roundRect(0, -h, w, h * 0.4, 15);
        ctx.fill();
        ctx.stroke();

        // 5. FACE DETAILS
        const eyeY = -h * 0.8;
        // Eyes (white background)
        ctx.fillStyle = pantsWhite;
        ctx.beginPath();
        ctx.ellipse(w * 0.3, eyeY, w * 0.12, h * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.7, eyeY, w * 0.12, h * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupils
        ctx.fillStyle = outlineBlack;
        ctx.beginPath();
        ctx.arc(w * 0.33, eyeY, w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.73, eyeY, w * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (open, surprised look)
        ctx.fillStyle = mouthDark;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, -h * 0.7, w * 0.15, h * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 6. HAIR
        ctx.fillStyle = hairBrown;
        ctx.beginPath();
        ctx.moveTo(w * 0.2, -h);
        ctx.quadraticCurveTo(w * 0.3, -h * 1.1, w * 0.4, -h);
        ctx.quadraticCurveTo(w * 0.5, -h * 1.1, w * 0.6, -h);
        ctx.quadraticCurveTo(w * 0.7, -h * 1.1, w * 0.8, -h);
        ctx.stroke();


        ctx.restore();
    },
    update() {
        if (this.crashed) return;

        // --- Cape physics update ---
        // Determine target angle based on state
        if (this.isDucking) {
            if (this._capeDuckTimer < 12) {
                // For the first 12 frames of ducking, cape goes up
                capeAngleTarget = CAPE_ANGLE_MAX * 0.9;
                this._capeDuckTimer++;
            } else {
                // After, cape falls down (gravity)
                capeAngleTarget = CAPE_ANGLE_MIN * 0.7;
            }
        } else if (!this.isDucking && !this.isJumping && this.y === GROUND_HEIGHT) {
            // Just finished ducking and now standing
            capeAngleTarget = 0.1 + Math.sin(Date.now() * 0.008) * 0.08; // Gentle flutter
            this._capeDuckTimer = 0;
        } else if (this.isJumping) {
            if (this.velocityY < -2) {
                // Going up
                capeAngleTarget = CAPE_ANGLE_MIN * 0.7; // Cape down
            } else if (this.velocityY > 2) {
                // Falling
                capeAngleTarget = CAPE_ANGLE_MAX; // Cape up
            } else {
                // In air, but not much vertical speed
                capeAngleTarget = 0;
            }
        } else {
            // Running/standing
            capeAngleTarget = 0.1 + Math.sin(Date.now() * 0.008) * 0.08; // Gentle flutter
        }
        // Smoothly approach target
        let diff = capeAngleTarget - capeAngle;
        capeAngleVel += diff * CAPE_ANGLE_SPEED;
        capeAngleVel *= (1 - CAPE_ANGLE_DAMPING);
        capeAngle += capeAngleVel;
        // Clamp
        if (capeAngle > CAPE_ANGLE_MAX) capeAngle = CAPE_ANGLE_MAX;
        if (capeAngle < CAPE_ANGLE_MIN) capeAngle = CAPE_ANGLE_MIN;

        if (this.isJumping) {
            this.velocityY += GRAVITY;
            this.y += this.velocityY;
        }

        if (this.y > GROUND_HEIGHT) {
            this.y = GROUND_HEIGHT;
            this.isJumping = false;
            this.velocityY = 0;
        }
        
        this.draw();
    },
    jump() {
        if (!this.isJumping && !this.isDucking && !isGameOver) {
            this.isJumping = true;
            this.velocityY = -20;
        }
    },
    duck() {
        if (!this.isJumping && !isGameOver) {
            this.isDucking = true;
            this.height = this.originalHeight / 2;
            // Keep the character's bottom position on the same y-axis
            this.y = GROUND_HEIGHT;
        }
    },
    unduck() {
        if (this.isDucking && !isGameOver) {
            this.isDucking = false;
            this.height = this.originalHeight;
            this.y = GROUND_HEIGHT;
        }
    }
};

// --- Obstacles (Missiles) ---
let obstacles = [];
const obstacleTypes = {
    missile: { width: 80, height: 30, draw: drawMissile }
};

// Background element drawing functions
function drawBuilding(element) {
    ctx.save();
    ctx.translate(element.x, element.y);
    // --- Static building body color ---
    const buildingColors = ['#6c757d', '#495057', '#343a40', '#212529'];
    if (!element.bodyColor) {
        element.bodyColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];
    }
    ctx.fillStyle = element.bodyColor;
    ctx.fillRect(0, 0, element.width, element.height);
    // Windows
    ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
    const windowSize = element.width / 10;
    const windowSpacing = windowSize * 1.5;
    const windowRows = Math.floor(element.height / windowSpacing);
    const windowCols = Math.floor(element.width / windowSpacing);
    // --- Static window pattern ---
    if (!element.windowPattern) {
        element.windowPattern = [];
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Store static lit/unlit state
                element.windowPattern.push({
                    row,
                    col,
                    lit: Math.random() > 0.3
                });
            }
        }
    }
    for (const win of element.windowPattern) {
        if (win.lit) {
            ctx.fillRect(
                win.col * windowSpacing + windowSize/2,
                win.row * windowSpacing + windowSize/2,
                windowSize,
                windowSize
            );
        }
    }
    ctx.restore();
}

function drawTree(element) {
    ctx.save();
    ctx.translate(element.x, element.y);
    // Tree trunk
    ctx.fillStyle = '#8B4513'; // Brown
    const trunkWidth = element.width * 0.2;
    const trunkHeight = element.height * 0.3;
    ctx.fillRect(
        element.width/2 - trunkWidth/2,
        element.height - trunkHeight,
        trunkWidth,
        trunkHeight
    );
    // Tree foliage (multiple layers of circles for a bushy look)
    ctx.fillStyle = '#2e7d32'; // Dark green
    const foliageSize = element.width * 0.8;
    // Draw main foliage body (3 overlapping circles)
    for (let i = 0; i < 3; i++) {
        const offsetX = (i - 1) * (element.width * 0.2);
        const offsetY = (i % 2) * (element.height * 0.1);
        const size = foliageSize - (i * element.width * 0.1);
        ctx.beginPath();
        ctx.arc(
            element.width/2 + offsetX,
            element.height - trunkHeight - size/2 - offsetY,
            size/2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    ctx.restore();
}

function drawCactus(element) {
    ctx.save();
    ctx.translate(element.x, element.y);
    // Main cactus body
    ctx.fillStyle = '#2e7d32'; // Dark green
    const bodyWidth = element.width * 0.4;
    // Main stem
    ctx.fillRect(
        element.width/2 - bodyWidth/2,
        0,
        bodyWidth,
        element.height
    );
    // Arms (50% chance for left, right, or both arms)
    const hasLeftArm = true; // Math.random() > 0.5;
    const hasRightArm =  true; // Math.random() > 0.5;
    const armHeight = element.height * 0.3;
    const armWidth = element.width * 0.6;
    const armY =   element.yArm;
    if (hasLeftArm) {
        // Left arm
        ctx.fillRect(
            element.width/2 - bodyWidth/2 - armWidth + bodyWidth/2,
            armY,
            armWidth,
            bodyWidth
        );
        // Left arm upward part
        ctx.fillRect(
            element.width/2 - bodyWidth/2 - armWidth + bodyWidth/2,
            armY - armHeight + bodyWidth,
            bodyWidth,
            armHeight
        );
    }
    if (hasRightArm) {
        // Right arm
        ctx.fillRect(
            element.width/2 + bodyWidth/2,
            armY,
            armWidth - bodyWidth/2,
            bodyWidth
        );
        // Right arm upward part
        ctx.fillRect(
            element.width/2 + bodyWidth/2 + armWidth - bodyWidth/2 - bodyWidth,
            armY - armHeight + bodyWidth,
            bodyWidth,
            armHeight
        );
    }
    ctx.restore();
}

function drawMissile(x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    
    // Fins (now on the right)
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(width + 15, -10);
    ctx.lineTo(width - 5, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width, height);
    ctx.lineTo(width + 15, height + 10);
    ctx.lineTo(width - 5, height);
    ctx.fill();

    // Missile Body
    ctx.fillStyle = '#495057';
    ctx.fillRect(20, 0, width - 20, height);

    // Nose cone (now on the left)
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(0, height / 2);
    ctx.lineTo(20, height);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Background element management functions for active gameplay
function initializeBackgroundElements() {
    backgroundElements = [];
    // Create static background elements spread across the entire screen width
    for (let x = -200; x < gameWidth + 200; x += 150 + Math.random() * 100) {
        backgroundElements.push(createBackgroundElement(x));
    }
}

function createBackgroundElement(x) {
    const types = ['building', 'tree', 'cactus'];
    const type = types[Math.floor(Math.random() * types.length)];
    const elementType = elementTypes[type];
    let element = {
        x: x,
        type: type,
        scale: 0.5 + Math.random() * 0.5, // Random scale between 0.5 and 1.0
        width: (elementType.minWidth + Math.random() * (elementType.maxWidth - elementType.minWidth)),
        height: (elementType.minHeight + Math.random() * (elementType.maxHeight - elementType.minHeight))
    };
    element.yArm = element.height * 0.2 + (Math.random() * element.height * 0.3);
    // Scale the dimensions
    element.width *= element.scale;
    element.height *= element.scale;
    element.y = GROUND_HEIGHT - element.height;
    // --- For buildings, generate static window pattern ---
    if (type === 'building') {
        element.windowPattern = undefined; // Will be generated on first draw
    }
    return element;
}

function updateBackgroundElements() {
    // Move background elements for parallax scrolling
    backgroundElements.forEach(element => {
        // Move elements at different speeds based on their scale (smaller = farther = slower)
        const parallaxSpeed = element.scale * 0.3; // Slower than game speed for parallax effect
        element.x -= parallaxSpeed * gameSpeed;
        
        // Recycle elements that have moved off-screen
        if (element.x + element.width < -100) {
            element.x = canvas.width + Math.random() * 200;
            // --- For buildings, reset window pattern so it is regenerated ---
            if (element.type === 'building') {
                element.windowPattern = undefined;
            }
        }
    });
}

// Background elements (buildings, clouds, stars) for enhanced parallax
class BackgroundElement {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        if (type === 'cloud') {
            this.width = 100 + Math.random() * 80;
            this.opacity = 0.7;
            this.color = rainActive ? '#888a8c' : '#ffffff';
        } else {
            this.width = type === 'building' ? 60 + Math.random() * 40 : 3;
            this.opacity = type === 'building' ? 0.3 : type === 'star' ? 0.6 : 1;
            this.color = undefined;
        }
        this.speed = type === 'building' ? 0.5 : type === 'cloud' ? 0.25 + Math.random() * 0.15 : 0.1;
        
        // Store static window pattern for buildings to avoid blinking
        if (this.type === 'building') {
            this.windowPattern = [];
            const windowRows = Math.floor(this.height / 12);
            const windowCols = Math.floor(this.width / 15);
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    // Create a static pattern - some windows lit, some not
                    this.windowPattern.push({
                        x: 5 + col * 15,
                        y: 5 + row * 12,
                        lit: Math.random() > 0.3 // 70% chance of being lit
                    });
                }
            }
        }
    }
    
    update() {
        // Move elements based on their parallax speed
        this.x -= this.speed * gameSpeed;
        
        // Recycle elements that have moved off-screen
        if (this.x + this.width < 0) {
            this.x = canvas.width + Math.random() * 100;
            
            // For buildings, generate new window pattern when recycled
            if (this.type === 'building') {
                this.windowPattern = [];
                const windowRows = Math.floor(this.height / 12);
                const windowCols = Math.floor(this.width / 15);
                for (let row = 0; row < windowRows; row++) {
                    for (let col = 0; col < windowCols; col++) {
                        this.windowPattern.push({
                            x: 5 + col * 15,
                            y: 5 + row * 12,
                            lit: Math.random() > 0.3
                        });
                    }
                }
            }
        }
    }
    
    draw() {
        ctx.globalAlpha = this.opacity;
        
        if (this.type === 'building') {
            // Static building without blinking windows
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw static windows using stored pattern
            this.windowPattern.forEach(window => {
                if (window.lit) {
                    ctx.fillStyle = '#ffff99';
                    ctx.fillRect(this.x + window.x, this.y + window.y, 8, 6);
                }
            });
        } else if (this.type === 'cloud') {
            ctx.fillStyle = (rainActive ? '#888a8c' : '#ffffff');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 3, 0, Math.PI * 2);
            ctx.arc(this.x + this.width / 3, this.y, this.width / 4, 0, Math.PI * 2);
            ctx.arc(this.x - this.width / 4, this.y, this.width / 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            // Static star
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.globalAlpha = 1;
    }
}

// Additional parallax background elements
let parallaxElements = [];

function initializeParallaxElements() {
    parallaxElements = [];
    
    // Create buildings
    for (let i = 0; i < 5; i++) {
        const buildingHeight = 80 + Math.random() * 60; // Match building height range
        parallaxElements.push(new BackgroundElement(
            canvas.width + i * 200 + Math.random() * 100,
            GROUND_HEIGHT - buildingHeight, // Ground buildings properly
            'building'
        ));
    }
    
    // Only add clouds if not night (and not transitioning to night)
    if (!nightActive) {
        for (let i = 0; i < 8; i++) {
            parallaxElements.push(new BackgroundElement(
                canvas.width + i * 180 + Math.random() * 120,
                40 + Math.random() * 120,
                'cloud'
            ));
        }
    }
    
    // Create stars
    for (let i = 0; i < 15; i++) {
        parallaxElements.push(new BackgroundElement(
            canvas.width + i * 60 + Math.random() * 200,
            20 + Math.random() * 150,
            'star'
        ));
    }
    // Add the moon in the background if night
    if (nightActive) {
        parallaxElements.push({
            type: 'moon',
            x: canvas.width - 120,
            y: 80,
            width: 90,
            height: 90,
            draw: function() {
                ctx.save();
                ctx.globalAlpha = 0.93;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2, 0, Math.PI*2);
                ctx.fillStyle = '#f7f7e6';
                ctx.shadowColor = '#fffbe6';
                ctx.shadowBlur = 30;
                ctx.fill();
                ctx.shadowBlur = 0;
                // Craters
                ctx.globalAlpha = 0.18;
                ctx.beginPath(); ctx.arc(this.x-18, this.y-10, 10, 0, Math.PI*2); ctx.fillStyle = '#bdbdbd'; ctx.fill();
                ctx.beginPath(); ctx.arc(this.x+12, this.y+8, 7, 0, Math.PI*2); ctx.fillStyle = '#bdbdbd'; ctx.fill();
                ctx.beginPath(); ctx.arc(this.x+20, this.y-12, 5, 0, Math.PI*2); ctx.fillStyle = '#bdbdbd'; ctx.fill();
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        });
    }
}

function updateParallaxElements() {
    parallaxElements.forEach(element => {
        element.update();
    });
}

function drawParallaxElements() {
    // Draw moon first if present (so it's behind stars/buildings)
    if (nightActive) {
        const moon = parallaxElements.find(e => e.type === 'moon');
        if (moon) moon.draw();
    }
    parallaxElements.forEach(element => {
        if (element.type === 'moon') return; // Already drawn
        if (nightActive && element.type === 'cloud') {
            // Skip drawing clouds at night
            return;
        }
        element.draw();
    });
}

function drawBackgroundElements() {
    backgroundElements.forEach(element => {
        // Make background elements slightly transparent for depth
        ctx.globalAlpha = 0.6;
        elementTypes[element.type].draw(element);
        ctx.globalAlpha = 1.0; // Reset alpha
    });
}

function spawnObstacle() {
    const type = obstacleTypes.missile;
    const spawnHeight = GROUND_HEIGHT - type.height - Math.random() * 80;
    obstacles.push({
        x: canvas.width,
        y: spawnHeight,
        width: type.width,
        height: type.height,
        draw: type.draw,
        passed: false
    });
}

let obstacleTimer = 0;
let nextObstacleTime = 100;

function updateObstacles() {
    if (player.crashed) return;

    // --- NEW: Gradually increase game speed every frame ---
    gameSpeed += 0.001;

    obstacleTimer++;
    if (obstacleTimer > nextObstacleTime) {
        spawnObstacle();
        obstacleTimer = 0;
        nextObstacleTime = Math.random() * (150 - 60) + 60 - (gameSpeed * 4);
        if (nextObstacleTime < 50) nextObstacleTime = 50;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        obs.draw(obs.x, obs.y, obs.width, obs.height);

        if (!obs.passed && obs.x + obs.width < player.x) {
            score++;
            obs.passed = true;
            scoreElement.textContent = `SCORE: ${score}`;
            checkRainActivation();
        }

        // Collision detection
        const playerTop = player.y - player.height;
        const playerBottom = player.y;
        const playerLeft = player.x;
        const playerRight = player.x + player.width;

        const obsTop = obs.y;
        const obsBottom = obs.y + obs.height;
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;

        if (
            !player.crashed &&
            playerLeft < obsRight &&
            playerRight > obsLeft &&
            playerTop < obsBottom &&
            playerBottom > obsTop
        ) {
            player.crashed = true;
            createExplosion(player.x + player.width / 2, player.y - player.height / 2);
            setTimeout(gameOver, 1000);
        }

        if (obs.x + obs.width < -50) { 
            obstacles.splice(i, 1);
        }
    }
}

// --- Night Mode ---
let nightActive = false;

// --- Rain Effect ---
let rainActive = false;
let rainParticles = [];
const RAIN_PARTICLE_COUNT = 80;
let lightningActive = false;
let lightningTimer = 0;
let lightningAlpha = 0;

function spawnRainParticles() {
    rainParticles = [];
    for (let i = 0; i < RAIN_PARTICLE_COUNT; i++) {
        rainParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vy: 8 + Math.random() * 6,
            length: 10 + Math.random() * 10,
            opacity: 0.3 + Math.random() * 0.5
        });
    }
}

function updateRainParticles() {
    for (let p of rainParticles) {
        p.y += p.vy;
        if (p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = -p.length;
        }
    }
}

function drawRainParticles() {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,180,255,0.5)';
    ctx.lineWidth = 2;
    for (let p of rainParticles) {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

function maybeTriggerLightning() {
    if (rainActive && Math.random() < 0.008 && !lightningActive) {
        lightningActive = true;
        lightningTimer = 0;
        lightningAlpha = 1;
    }
}

function drawLightning() {
    if (lightningActive) {
        ctx.save();
        ctx.globalAlpha = lightningAlpha;
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.restore();
        lightningAlpha -= 0.12;
        lightningTimer++;
        if (lightningAlpha <= 0) {
            lightningActive = false;
            lightningAlpha = 0;
        }
    }
}

function checkRainActivation() {
    // Smooth rain/night activation/deactivation: after score 20, any combination of night/rain/none can occur
    const rainStart = 20;
    const rainEnd = 40;
    // After score 20, randomly decide if night, rain, both, or none should be active (and keep that state until score leaves range)
    if (score === rainStart) {
        // Only randomize at the moment score hits 20
        const nightRand = Math.random() < 0.5; // 50% chance for night
        const rainRand = Math.random() < 0.5; // 50% chance for rain
        window._nightRainState = { night: nightRand, rain: rainRand };
    }
    if (score >= rainStart && score <= rainEnd) {
        if (window._nightRainState) {
            nightActive = window._nightRainState.night;
            if (!rainActive && window._nightRainState.rain) {
                rainActive = true;
                spawnRainParticles();
            }
            if (!window._nightRainState.rain && rainActive) {
                // Fade out rain if it was previously on
                for (let p of rainParticles) {
                    p.opacity -= 0.03;
                    if (p.opacity < 0) p.opacity = 0;
                }
                if (rainParticles.every(p => p.opacity <= 0.01)) {
                    rainActive = false;
                    rainParticles = [];
                    lightningActive = false;
                    lightningAlpha = 0;
                }
            }
        }
    } else {
        // Outside the range, reset both
        nightActive = false;
        if (rainActive) {
            for (let p of rainParticles) {
                p.opacity -= 0.03;
                if (p.opacity < 0) p.opacity = 0;
            }
            if (rainParticles.every(p => p.opacity <= 0.01)) {
                rainActive = false;
                rainParticles = [];
                lightningActive = false;
                lightningAlpha = 0;
            }
        }
        window._nightRainState = null;
    }
}

// --- Ground ---
// --- Pebble Data ---
let groundPebbles = [];
function generateGroundPebbles() {
    groundPebbles = [];
    const circleCount = Math.floor(canvas.width / 22);
    for (let i = 0; i < circleCount; i++) {
        const x = i * (canvas.width / circleCount) + Math.random() * 12 - 6;
        const y = GROUND_HEIGHT + 18 + Math.random() * (canvas.height - GROUND_HEIGHT - 30);
        const radius = 5 + Math.random() * 7;
        const shade = Math.random();
        let color;
        if (shade < 0.33) {
            color = '#3d2612';
        } else if (shade < 0.66) {
            color = '#7a5230';
        } else {
            color = '#bca37a';
        }
        const alpha = 0.45 + Math.random() * 0.35;
        const shadowBlur = Math.random() < 0.5 ? 0 : 6;
        // 1 in 20 chance to be a worm
        const isWorm = Math.random() < 0.05;
        let wormParams = null;
        if (isWorm) {
            // Worm: random length, orientation, and wiggle phase
            wormParams = {
                length: 18 + Math.random() * 16,
                angle: Math.random() * Math.PI * 2,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() < 0.5 ? '#e48ca3' : '#d16e6e',
                thickness: 3 + Math.random() * 2
            };
        }
        groundPebbles.push({ x, y, radius, color, alpha, shadowBlur, isWorm, wormParams });
    }
}

function drawGround() {
    // Draw main ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, GROUND_HEIGHT, canvas.width, canvas.height - GROUND_HEIGHT);

    // Move and draw decorative circles (pebbles, stones, worms, etc.)
    for (const pebble of groundPebbles) {
        // Move pebbles/worms leftward
        pebble.x -= gameSpeed;
        // If off screen to the left, recycle to the right
        if (pebble.x + (pebble.isWorm ? (pebble.wormParams ? pebble.wormParams.length : 0) : pebble.radius) < 0) {
            pebble.x = canvas.width + (pebble.isWorm ? (pebble.wormParams ? pebble.wormParams.length : 0) : pebble.radius) + Math.random() * 20;
            pebble.y = GROUND_HEIGHT + 18 + Math.random() * (canvas.height - GROUND_HEIGHT - 30);
            pebble.radius = 5 + Math.random() * 7;
            const shade = Math.random();
            if (shade < 0.33) {
                pebble.color = '#3d2612';
            } else if (shade < 0.66) {
                pebble.color = '#7a5230';
            } else {
                pebble.color = '#bca37a';
            }
            pebble.alpha = 0.45 + Math.random() * 0.35;
            pebble.shadowBlur = Math.random() < 0.5 ? 0 : 6;
            // 1 in 20 chance to be a worm
            pebble.isWorm = Math.random() < 0.05;
            if (pebble.isWorm) {
                pebble.wormParams = {
                    length: 18 + Math.random() * 16,
                    angle: Math.random() * Math.PI * 2,
                    phase: Math.random() * Math.PI * 2,
                    color: Math.random() < 0.5 ? '#e48ca3' : '#d16e6e',
                    thickness: 3 + Math.random() * 2
                };
            } else {
                pebble.wormParams = null;
            }
        }
        ctx.save();
        if (pebble.isWorm && pebble.wormParams) {
            // Draw worm as a wavy line
            const { length, angle, phase, color, thickness } = pebble.wormParams;
            ctx.translate(pebble.x, pebble.y);
            ctx.rotate(angle);
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            for (let t = 0; t <= 1; t += 0.08) {
                const x = t * length;
                const y = Math.sin(phase + t * 4 * Math.PI) * 4;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else {
            ctx.globalAlpha = pebble.alpha;
            ctx.beginPath();
            ctx.arc(pebble.x, pebble.y, pebble.radius, 0, Math.PI * 2);
            ctx.fillStyle = pebble.color;
            ctx.shadowColor = pebble.color;
            ctx.shadowBlur = pebble.shadowBlur;
            ctx.fill();
        }
        ctx.restore();
    }

    // Draw grass line
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_HEIGHT);
    ctx.lineTo(canvas.width, GROUND_HEIGHT);
    ctx.stroke();
}

// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Night overlay
    if (nightActive) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#0a1633';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    // Draw background elements first (behind everything) during active gameplay
    if (!isGameOver) {
        // Update and draw parallax elements (buildings, clouds, stars)
        updateParallaxElements();
        drawParallaxElements();
        
        // Update and draw ground-based background elements (trees, cacti, buildings)
        updateBackgroundElements(); // Now includes parallax scrolling movement
        drawBackgroundElements();
    }
    
    drawGround();
    
    if (!isGameOver) {
        updateObstacles();
        player.update();
    } else {
        obstacles.forEach(obs => obs.draw(obs.x, obs.y, obs.width, obs.height));
        player.draw();
    }
    
    if (rainActive) {
        updateRainParticles();
        drawRainParticles();
        maybeTriggerLightning();
        drawLightning();
    }
    updateParticles();
}

// --- Game State ---
function startGame() {
    isGameOver = false;
    player.crashed = false;
    particles = [];
    backgroundElements = []; // Clear background elements when starting new game
    parallaxElements = []; // Clear parallax elements when starting new game
    score = 0;
    gameSpeed = 5; // Speed resets on start
    obstacles = [];
    player.y = GROUND_HEIGHT;
    player.isJumping = false;
    player.isDucking = false; // Reset ducking state
    player.height = player.originalHeight; // Reset height
    player._capeDuckTimer = 0; // Reset cape duck timer
    
    // Reset cape physics
    capeAngle = 0;
    capeAngleTarget = 0;
    capeAngleVel = 0;
    
    // Rain and night reset
    rainActive = false;
    rainParticles = [];
    nightActive = false;
    lightningActive = false;
    lightningAlpha = 0;
    window._nightRainState = null;
    
    // Regenerate pebbles for new game (in case of resize)
    generateGroundPebbles();
    scoreElement.textContent = `SCORE: 0`;
    
    // Clear any pending leaderboard timeout
    if (leaderboardTimeout) {
        clearTimeout(leaderboardTimeout);
        leaderboardTimeout = null;
    }
    
    // Hide leaderboard if it's showing
    hideLeaderboard();
    
    // Initialize background elements for active gameplay
    initializeBackgroundElements();
    initializeParallaxElements();
    
    infoOverlay.style.opacity = '0';
    infoOverlay.style.pointerEvents = 'none';
}

function gameOver() {
    isGameOver = true;
    
    // Save score if in Telegram
    if (isTelegramApp && telegramUser) {
        saveScore(score);
    }
    
    infoOverlay.querySelector('h1').textContent = 'GAME OVER!';
    
    // Update the message based on whether we're in Telegram
    let message = `Your score: ${score}. Tap to restart.`;
    if (isTelegramApp && telegramUser) {
        message += ' Tap leaderboard to see top players!';
    }
    infoOverlay.querySelector('p').textContent = message;
    
    infoOverlay.style.opacity = '1';
    infoOverlay.style.pointerEvents = 'auto';
    
    // Show leaderboard after a short delay if in Telegram
    if (isTelegramApp && telegramUser) {
        leaderboardTimeout = setTimeout(() => {
            if (isGameOver) { // Only show if still game over
                showLeaderboard();
            }
            leaderboardTimeout = null;
        }, 2000);
    }
}

// --- Event Listeners ---
function handleInput() {
     if (isGameOver) {
        startGame();
    } else {
        player.jump();
    }
}

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleInput();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        player.duck();
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        player.unduck();
    }
}

// Use both touch and mouse/keyboard events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior (like scrolling)
    handleInput();
});
canvas.addEventListener('mousedown', handleInput);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
infoOverlay.addEventListener('click', startGame);

// --- Mobile Controls ---
const jumpBtn = document.getElementById('jump-btn');
const duckBtn = document.getElementById('duck-btn');

if (jumpBtn && duckBtn) {
    jumpBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleInput();
    });
    jumpBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        handleInput();
    });
    duckBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        player.duck();
    });
    duckBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        player.duck();
    });
    // Release duck on touchend/mouseup
    duckBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        player.unduck();
    });
    duckBtn.addEventListener('mouseup', function(e) {
        e.preventDefault();
        player.unduck();
    });
    // Prevent context menu on long press
    duckBtn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    jumpBtn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
}

// Leaderboard event listeners
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', hideLeaderboard);
}

const shareLeaderboardBtn = document.getElementById('share-leaderboard');
if (shareLeaderboardBtn) {
    shareLeaderboardBtn.addEventListener('click', shareLeaderboard);
}

const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
if (showLeaderboardBtn) {
    showLeaderboardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showLeaderboard();
    });
}

// Initialize Telegram WebApp on page load
document.addEventListener('DOMContentLoaded', () => {
    initTelegramApp();
});

// Also try to initialize immediately in case DOM is already loaded
initTelegramApp();

// Initial draw
generateGroundPebbles();
animate();