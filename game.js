const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 50,
    y: 300,
    width: 50,
    height: 50,
    speed: 5,
    jumpForce: -15,
    gravity: 0.8,
    velocity: 0,
    jumping: false,
    score: 0
};

const obstacles = [];

let gameStarted = false;
let isGameOver = false;

// Load images with correct paths from media folder
const playerSprite = new Image();
playerSprite.src = 'media/mario.png';
playerSprite.onerror = () => console.error('Error loading mario sprite');

const gengarSprite = new Image();
gengarSprite.src = 'media/gengar.png';
gengarSprite.onerror = () => console.error('Error loading gengar sprite');

const logoSprite = new Image();
logoSprite.src = 'media/mario-logo.png';
logoSprite.onerror = () => console.error('Error loading mario logo');

// Add retry icon path data
const retryPath = new Path2D('M 0 -15 A 15 15 0 1 1 0 15 A 15 15 0 1 1 0 -15 M -5 -5 L -5 -10 L -10 -5 L -5 0 L -5 -5 M 5 5 L 5 10 L 10 5 L 5 0 L 5 5');

// Add button state tracking
let isHoveringRetry = false;
let isPressingRetry = false;

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 300,
        width: 50,
        height: 50,
        speed: 5
    });
}

function jump() {
    if (!player.jumping) {
        player.jumping = true;
        player.velocity = player.jumpForce;
    }
}

function update() {
    if (!gameStarted || isGameOver) return;

    // Player jump physics
    if (player.jumping) {
        player.y += player.velocity;
        player.velocity += player.gravity;

        // Ground collision
        if (player.y >= 300) {
            player.y = 300;
            player.jumping = false;
            player.velocity = 0;
        }
    }

    // Reduce spawn rate from 0.02 (2%) to 0.01 (1%)
    // This means Gengars will spawn half as frequently
    if (Math.random() < 0.01) {
        spawnObstacle();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        // Slightly reduce speed from 5 to 4 to make it easier
        obstacles[i].x -= 4;

        // Remove obstacles that are off screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            player.score++;
            continue;
        }

        // Collision detection
        if (player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y) {
            gameOver();
        }
    }
}

function drawRetryButton(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // Scale effect when pressing
    if (isPressingRetry) {
        ctx.scale(0.9, 0.9);
    } else if (isHoveringRetry) {
        ctx.scale(1.1, 1.1);
    }
    
    // Glow effect on hover
    if (isHoveringRetry) {
        ctx.shadowColor = '#FF6B6B';
        ctx.shadowBlur = 15;
    }

    // Draw button background
    ctx.fillStyle = isHoveringRetry ? '#FF3333' : '#E52521';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    // Draw retry icon
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke(retryPath);
    
    ctx.restore();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground - changed from #8b4513 to #2e8b57 (Sea Green)
    ctx.fillStyle = '#2e8b57';
    ctx.fillRect(0, 350, canvas.width, 50);

    if (!gameStarted) {
        // Start screen with logo
        try {
            ctx.drawImage(logoSprite, canvas.width/2 - 150, 50, 300, 100);
        } catch(e) {
            console.error('Error drawing logo:', e);
        }
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.fillText('Click to Start!', canvas.width/2 - 120, canvas.height/2);
        return;
    }

    // Draw player with sprite
    try {
        ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
    } catch(e) {
        // Fallback to rectangle if image fails
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw obstacles with sprites
    obstacles.forEach(obstacle => {
        try {
            ctx.drawImage(gengarSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } catch(e) {
            // Fallback to rectangle if image fails
            ctx.fillStyle = 'purple';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${player.score}`, 20, 30);

    if (isGameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw logo
        try {
            ctx.drawImage(logoSprite, canvas.width/2 - 150, 50, 300, 100);
        } catch(e) {
            console.error('Error drawing logo:', e);
        }

        // Game Over text
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
        
        // Final Score
        ctx.font = '32px Arial';
        ctx.fillText(`Final Score: ${player.score}`, canvas.width/2 - 80, canvas.height/2 + 50);

        // Draw retry button
        drawRetryButton(canvas.width/2, canvas.height/2 + 100);
    }
}

function gameOver() {
    isGameOver = true;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        jump();
    }
});

// Update event listeners
canvas.addEventListener('mousemove', (event) => {
    if (isGameOver) {
        const buttonX = canvas.width/2;
        const buttonY = canvas.height/2 + 100;
        const dx = event.offsetX - buttonX;
        const dy = event.offsetY - buttonY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        isHoveringRetry = distance <= 25;
        canvas.style.cursor = isHoveringRetry ? 'pointer' : 'default';
    } else {
        isHoveringRetry = false;
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mousedown', (event) => {
    if (isHoveringRetry) {
        isPressingRetry = true;
    }
});

canvas.addEventListener('mouseup', (event) => {
    isPressingRetry = false;
});

canvas.addEventListener('mouseleave', (event) => {
    isHoveringRetry = false;
    isPressingRetry = false;
    canvas.style.cursor = 'default';
});

// Update click handler
canvas.addEventListener('click', (event) => {
    if (!gameStarted) {
        console.log('Game starting');
        gameStarted = true;
        return;
    }

    if (isGameOver && isHoveringRetry) {
        resetGame();
        isHoveringRetry = false;
        isPressingRetry = false;
    }
});

function resetGame() {
    player.score = 0;
    player.y = 300;
    player.jumping = false;
    player.velocity = 0;
    obstacles.length = 0; // Clear all obstacles
    isGameOver = false;
}

// Start the game
gameLoop(); 