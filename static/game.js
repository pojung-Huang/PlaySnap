const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const startButton = document.querySelector('.start-button-container');

// 設置畫布大小
function resizeCanvas() {
    const gameHeight = canvas.parentElement.clientHeight;
    canvas.height = gameHeight;
    canvas.width = gameHeight * 4 / 3; // 保持 4:3 的比例
}

// 初始化畫布大小
resizeCanvas();

// 監聽視窗大小變化
window.addEventListener('resize', () => {
    resizeCanvas();
    if (snake && food) {
        snake.draw();
        food.draw();
    }
});

const GRID_SIZE = Math.floor(canvas.height / 30); // 動態計算網格大小
const GRID_WIDTH = Math.floor(canvas.width / GRID_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / GRID_SIZE);

let backgroundImage = null;
const COLORS = {
    SNAKE: 'rgba(0, 255, 0, 0.8)',  // 半透明綠色
    FOOD: 'rgba(255, 0, 0, 0.8)',   // 半透明紅色
    BACKGROUND: 'rgba(0, 0, 0, 0.5)' // 半透明黑色
};

let snake = null;
let food = null;
let gameLoop = null;
let score = 0;
let currentPlayer = null;
const defaultBackground = COLORS.BACKGROUND;

class Snake {
    constructor() {
        this.positions = [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
        this.direction = { x: 1, y: 0 };
        this.length = 1;
        this.isChangingDirection = false;
    }

    update() {
        this.isChangingDirection = false;

        const head = this.positions[0];
        const newHead = {
            x: (head.x + this.direction.x + GRID_WIDTH) % GRID_WIDTH,
            y: (head.y + this.direction.y + GRID_HEIGHT) % GRID_HEIGHT
        };

        // 檢查是否撞到自己
        if (this.positions.some(pos => pos.x === newHead.x && pos.y === newHead.y)) {
            return false;
        }

        this.positions.unshift(newHead);
        if (this.positions.length > this.length) {
            this.positions.pop();
        }
        return true;
    }

    draw() {
        ctx.fillStyle = COLORS.SNAKE;
        this.positions.forEach(pos => {
            ctx.fillRect(pos.x * GRID_SIZE, pos.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
        });
    }
}

class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.randomize();
    }

    randomize() {
        this.position.x = Math.floor(Math.random() * GRID_WIDTH);
        this.position.y = Math.floor(Math.random() * GRID_HEIGHT);
    }

    draw() {
        ctx.fillStyle = COLORS.FOOD;
        ctx.fillRect(
            this.position.x * GRID_SIZE,
            this.position.y * GRID_SIZE,
            GRID_SIZE - 1,
            GRID_SIZE - 1
        );
    }
}

function startGame() {
    // 隱藏開始按鈕
    startButton.style.display = 'none';

    if (gameLoop) {
        clearInterval(gameLoop);
    }

    snake = new Snake();
    food = new Food();
    score = 0;
    scoreElement.textContent = score;

    gameLoop = setInterval(update, 100);
}

async function updateLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();
        const leaderboardList = document.querySelector('.leaderboard-list');
        leaderboardList.innerHTML = leaderboard
            .map((entry, index) => `
                <li class="leaderboard-item">
                    <div>
                        <span>${index + 1}. ${entry.name}</span>
                        <span class="leaderboard-date">${entry.date}</span>
                    </div>
                    <span>${entry.score}分</span>
                </li>
            `)
            .join('');
    } catch (error) {
        console.error('更新排行榜失敗:', error);
    }
}

async function submitScore(score) {
    const name = prompt('恭喜！請輸入您的名字：');
    if (name) {
        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, score }),
            });
            await updateLeaderboard();
        } catch (error) {
            console.error('提交分數失敗:', error);
        }
    }
}

// 添加背景圖片處理函數
function handleBackgroundImage(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        backgroundImage = new Image();
        backgroundImage.src = e.target.result;

        // 儲存到 localStorage
        localStorage.setItem('snakeGameBg', e.target.result);

        // 重繪畫面
        update();
    };
    reader.readAsDataURL(file);
}

// 重設背景函數
function resetBackground() {
    backgroundImage = null;
    localStorage.removeItem('snakeGameBg');
    update();
}

// 修改 update 函數
function update() {
    // 1. 先清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 繪製背景
    if (backgroundImage) {
        // 繪製背景圖
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // 使用預設背景色
        ctx.fillStyle = defaultBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. 檢查遊戲狀態
    if (!snake.update()) {
        clearInterval(gameLoop);
        submitScore(score);
        alert('遊戲結束！分數：' + score);
        // 顯示開始按鈕
        startButton.style.display = 'block';
        return;
    }

    // 4. 檢查食物碰撞
    const head = snake.positions[0];
    if (head.x === food.position.x && head.y === food.position.y) {
        snake.length++;
        score += 10;
        scoreElement.textContent = score;
        food.randomize();
    }

    // 5. 繪製蛇和食物
    snake.draw();
    food.draw();
}

document.addEventListener('keydown', (event) => {
    const key = event.key;
    const direction = snake.direction;

    if (snake.isChangingDirection) return;
    snake.isChangingDirection = true;

    switch (key) {
        case 'ArrowUp':
            if (direction.y === 0) {
                snake.direction = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (direction.y === 0) {
                snake.direction = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (direction.x === 0) {
                snake.direction = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (direction.x === 0) {
                snake.direction = { x: 1, y: 0 };
            }
            break;
    }
});

// 在頁面加載時更新排行榜
document.addEventListener('DOMContentLoaded', () => {
    updateLeaderboard();
    const savedBg = localStorage.getItem('snakeGameBg');
    if (savedBg) {
        backgroundImage = new Image();
        backgroundImage.src = savedBg;
    }
    // 確保按鈕一開始是可見的
    startButton.style.display = 'block';
});

// 在文件底部添加事件監聽
document.getElementById('bgUpload').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        handleBackgroundImage(e.target.files[0]);
    }
});