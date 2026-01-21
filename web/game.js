const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-btn");
const scoreDisplay = document.getElementById("score-display");
const nameScreen = document.getElementById("name-screen");
const nameInput = document.getElementById("name-input");
const playBtn = document.getElementById("play-btn");
const playerNameDisplay = document.getElementById("player-name-display");

// Player name
let playerName = "";

// Game constants
const GROUND_HEIGHT = 50;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const INITIAL_GAME_SPEED = 4;
const SPEED_INCREMENT = 0.0005;
const OBSTACLE_SPACING = 400; // Fixed spacing between obstacles

// Game state
let gameRunning = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem("runnerHighScore") || 0;
let gameSpeed = INITIAL_GAME_SPEED;
let frameCount = 0;
let obstacleIndex = 0; // Track which obstacle pattern we're on
let bonusScore = 0; // Bonus points from balloons

// Player
const player = {
  x: 80,
  y: 0,
  width: 100,
  height: 100,
  velocityY: 0,
  isJumping: false,
  sprite: null,
};

// Obstacles
let obstacles = [];
let balloons = [];

// Ground
const ground = {
  y: canvas.height - GROUND_HEIGHT,
};

// Initialize player position
player.y = ground.y - player.height;

// Load player sprite
const mascotImg = new Image();
mascotImg.onload = () => {
  player.sprite = mascotImg;
};
mascotImg.src = "mascot.png";

// Load obstacle sprite
const obstacleImg = new Image();
obstacleImg.src = "obstacle1.png";

// Player collision uses an ellipse shape (more forgiving than rectangle)
// Returns the player's collision ellipse
function getPlayerEllipse() {
  return {
    cx: player.x + player.width / 2,
    cy: player.y + player.height / 2,
    rx: player.width * 0.35,  // Horizontal radius (narrower)
    ry: player.height * 0.45  // Vertical radius
  };
}

// Default player sprite (simple rectangle if no image loaded)
function drawDefaultPlayer() {
  ctx.fillStyle = "#6c5ce7";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Simple face
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 30, player.y + 12, 8, 8);
  ctx.fillRect(player.x + 15, player.y + 30, 20, 5);
}

// Draw player
function drawPlayer() {
  if (player.sprite) {
    ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);
  } else {
    drawDefaultPlayer();
  }
}

// Draw collision ellipse for debugging
function drawCollisionEllipse() {
  const ellipse = getPlayerEllipse();
  ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Deterministic obstacle patterns (height, width)
const OBSTACLE_PATTERNS = [
  { height: 40, width: 30 },
  { height: 50, width: 25 },
  { height: 35, width: 35 },
  { height: 55, width: 28 },
  { height: 45, width: 32 },
  { height: 60, width: 25 },
  { height: 38, width: 30 },
  { height: 52, width: 27 },
];

// Create obstacle with deterministic pattern
function createObstacle() {
  const pattern = OBSTACLE_PATTERNS[obstacleIndex % OBSTACLE_PATTERNS.length];
  obstacleIndex++;

  obstacles.push({
    x: canvas.width,
    y: ground.y - pattern.height,
    width: pattern.width,
    height: pattern.height,
    passed: false,
  });
}

// Draw obstacles
function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (obstacleImg.complete && obstacleImg.naturalWidth > 0) {
      ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });
}

// Create balloon
function createBalloon() {
  const radius = 20 + Math.random() * 10;
  // Balloons float at various heights in the jump zone
  const minY = 60;
  const maxY = ground.y - player.height - radius * 2;
  const y = minY + Math.random() * (maxY - minY);

  balloons.push({
    x: canvas.width + radius,
    y: y,
    radius: radius,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    passed: false,
  });
}

// Draw balloons
function drawBalloons() {
  balloons.forEach((balloon) => {
    // Balloon body
    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.ellipse(balloon.x, balloon.y, balloon.radius, balloon.radius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Balloon highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.ellipse(balloon.x - balloon.radius * 0.3, balloon.y - balloon.radius * 0.4, balloon.radius * 0.25, balloon.radius * 0.35, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Balloon knot
    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.moveTo(balloon.x - 4, balloon.y + balloon.radius * 1.2);
    ctx.lineTo(balloon.x + 4, balloon.y + balloon.radius * 1.2);
    ctx.lineTo(balloon.x, balloon.y + balloon.radius * 1.2 + 8);
    ctx.fill();

    // Balloon string
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(balloon.x, balloon.y + balloon.radius * 1.2 + 8);
    ctx.quadraticCurveTo(balloon.x + 5, balloon.y + balloon.radius * 1.2 + 25, balloon.x - 3, balloon.y + balloon.radius * 1.2 + 40);
    ctx.stroke();
  });
}

// Handle balloon collision - push balloon away and score
function handleBalloonCollision(balloon) {
  if (balloon.hit) return;

  const playerEllipse = getPlayerEllipse();

  // Check ellipse vs ellipse collision (player vs balloon)
  const dx = balloon.x - playerEllipse.cx;
  const dy = balloon.y - playerEllipse.cy;

  // Combined radii for collision
  const combinedRx = playerEllipse.rx + balloon.radius;
  const combinedRy = playerEllipse.ry + balloon.radius * 1.2;

  // Normalized distance
  const normalizedDist = (dx * dx) / (combinedRx * combinedRx) + (dy * dy) / (combinedRy * combinedRy);

  if (normalizedDist <= 1) {
    balloon.hit = true;
    bonusScore += 25;

    // Push balloon away from player
    const pushStrength = 8;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    balloon.velocityX = (balloon.velocityX || 0) + (dx / distance) * pushStrength;
    balloon.velocityY = (balloon.velocityY || 0) + (dy / distance) * pushStrength;
  }
}

// Draw ground
function drawGround() {
  // Ground fill
  ctx.fillStyle = "#5d5d7a";
  ctx.fillRect(0, ground.y, canvas.width, GROUND_HEIGHT);

  // Ground line
  ctx.strokeStyle = "#4a4a6a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, ground.y);
  ctx.lineTo(canvas.width, ground.y);
  ctx.stroke();

  // Ground texture dots
  ctx.fillStyle = "#4a4a6a";
  for (let i = 0; i < canvas.width; i += 40) {
    const offset = (frameCount * gameSpeed) % 40;
    ctx.fillRect((i - offset + canvas.width) % canvas.width, ground.y + 15, 3, 3);
    ctx.fillRect((i - offset + 20 + canvas.width) % canvas.width, ground.y + 30, 2, 2);
  }
}

// Draw background
function drawBackground() {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, ground.y);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, ground.y);

  // Simple clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  const cloudOffset = (frameCount * 0.5) % (canvas.width + 200);
  drawCloud(100 - cloudOffset + canvas.width, 50);
  drawCloud(350 - cloudOffset + canvas.width, 80);
  drawCloud(600 - cloudOffset + canvas.width, 40);
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
  ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 5, 15, 0, Math.PI * 2);
  ctx.fill();
}

// Check collision between player ellipse and obstacle rectangle
function checkCollision(obstacle) {
  const ellipse = getPlayerEllipse();

  // Find the closest point on the rectangle to the ellipse center
  const closestX = Math.max(obstacle.x, Math.min(ellipse.cx, obstacle.x + obstacle.width));
  const closestY = Math.max(obstacle.y, Math.min(ellipse.cy, obstacle.y + obstacle.height));

  // Check if that point is inside the ellipse
  const dx = closestX - ellipse.cx;
  const dy = closestY - ellipse.cy;

  return (dx * dx) / (ellipse.rx * ellipse.rx) + (dy * dy) / (ellipse.ry * ellipse.ry) <= 1;
}

// Update game state
function update() {
  if (!gameRunning || gameOver) return;

  frameCount++;

  // Increase speed over time
  gameSpeed = INITIAL_GAME_SPEED + frameCount * SPEED_INCREMENT;

  // Update score (time-based + bonus from balloons)
  score = Math.floor(frameCount / 10) + bonusScore;

  // Player physics
  player.velocityY += GRAVITY;
  player.y += player.velocityY;

  // Ground collision
  if (player.y >= ground.y - player.height) {
    player.y = ground.y - player.height;
    player.velocityY = 0;
    player.isJumping = false;
  }

  // Update obstacles
  obstacles.forEach((obstacle) => {
    obstacle.x -= gameSpeed;
  });

  // Remove off-screen obstacles
  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);

  // Spawn new obstacles at fixed intervals
  const lastObstacle = obstacles[obstacles.length - 1];

  if (!lastObstacle || lastObstacle.x < canvas.width - OBSTACLE_SPACING) {
    createObstacle();
  }

  // Update balloons
  balloons.forEach((balloon) => {
    // Initialize velocities if not set
    if (balloon.velocityX === undefined) balloon.velocityX = 0;
    if (balloon.velocityY === undefined) balloon.velocityY = 0;

    // Apply velocities
    balloon.x += balloon.velocityX - gameSpeed;
    balloon.y += balloon.velocityY;

    // Apply friction/drag to slow down
    balloon.velocityX *= 0.95;
    balloon.velocityY *= 0.95;

    // Float back toward original height slowly
    if (balloon.originalY === undefined) balloon.originalY = balloon.y;
    balloon.velocityY += (balloon.originalY - balloon.y) * 0.02;
  });

  // Remove off-screen balloons
  balloons = balloons.filter((balloon) => balloon.x + balloon.radius > -50);

  // Spawn new balloons
  const lastBalloon = balloons[balloons.length - 1];
  const balloonMinDistance = 200 + Math.random() * 150;

  if (!lastBalloon || lastBalloon.x < canvas.width - balloonMinDistance) {
    if (Math.random() < 0.015) {
      createBalloon();
    }
  }

  // Check collisions with obstacles
  for (const obstacle of obstacles) {
    if (checkCollision(obstacle)) {
      endGame();
      return;
    }
  }

  // Handle balloon collisions (push them away)
  for (const balloon of balloons) {
    handleBalloonCollision(balloon);
  }
}

// Draw game
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawGround();
  drawObstacles();
  drawBalloons();
  drawPlayer();

  // Update score display
  scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore}`;

  // Game over text
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#ffd700";
    ctx.font = "24px Arial";
    ctx.fillText(playerName, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 35);
    ctx.font = "18px Arial";
    ctx.fillText("Press SPACE or CLICK to restart", canvas.width / 2, canvas.height / 2 + 70);
  }

  // Start screen
  if (!gameRunning && !gameOver && nameScreen.classList.contains("hidden")) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PROMON FUNRUN", canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = "#ffd700";
    ctx.font = "24px Arial";
    ctx.fillText(`Welcome, ${playerName}!`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText("Press SPACE or CLICK to start", canvas.width / 2, canvas.height / 2 + 45);
  }
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
  gameRunning = true;
  gameOver = false;
  score = 0;
  frameCount = 0;
  gameSpeed = INITIAL_GAME_SPEED;
  obstacles = [];
  balloons = [];
  obstacleIndex = 0; // Reset pattern for consistent runs
  bonusScore = 0;
  player.y = ground.y - player.height;
  player.velocityY = 0;
  player.isJumping = false;
}

// End game
function endGame() {
  gameOver = true;
  gameRunning = false;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("runnerHighScore", highScore);
  }
}

// Jump
function jump() {
  // Don't allow jumping while name screen is visible
  if (!nameScreen.classList.contains("hidden")) {
    return;
  }

  if (gameOver) {
    startGame();
    return;
  }

  if (!gameRunning) {
    startGame();
    return;
  }

  if (!player.isJumping) {
    player.velocityY = JUMP_FORCE;
    player.isJumping = true;
  }
}

// Event listeners
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

canvas.addEventListener("click", jump);

startBtn.addEventListener("click", startGame);

// Name screen handlers
function enterGame() {
  playerName = nameInput.value.trim() || "Player";
  nameScreen.classList.add("hidden");
  playerNameDisplay.textContent = `Playing as: ${playerName}`;
}

playBtn.addEventListener("click", enterGame);

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    enterGame();
  }
});

// Focus name input on load
nameInput.focus();

// Initialize
draw();
gameLoop();
