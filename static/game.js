const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const startButton = document.querySelector('.start-button-container');
const surrenderBtn = document.getElementById('surrenderBtn');
const surrenderText = document.getElementById('surrenderText');

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
    initButtonPosition();
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
let isRunning = false;
let originalPosition = { x: 0, y: 0 };

// 添加點擊計數器和計時器
let clickCount = 0;
let clickTimer = null;

class Snake {
    constructor() {
        this.positions = [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
        this.direction = { x: 1, y: 0 };
        this.length = 1;
        this.isChangingDirection = false;
        this.bodyColors = [
            '#32CD32', // 亮綠色
            '#2FBC2F',
            '#2CAC2C',
            '#299C29',
            '#268C26',
            '#237D23'  // 最深綠色
        ];
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
        // 確保有正確的繪圖上下文
        if (!ctx) return;

        this.positions.forEach((pos, index) => {
            const x = pos.x * GRID_SIZE;
            const y = pos.y * GRID_SIZE;
            const size = GRID_SIZE - 1;

            if (index === 0) {
                // 繪製蛇頭（深綠色）
                ctx.fillStyle = '#006400';
                ctx.fillRect(x, y, size, size);

                // 添加紅色舌頭
                ctx.fillStyle = '#FF0000';
                if (this.direction.x === 1) { // 向右
                    ctx.fillRect(x + size, y + size / 2 - 1, 8, 2);
                    ctx.fillRect(x + size + 4, y + size / 2 - 2, 4, 1);
                    ctx.fillRect(x + size + 4, y + size / 2 + 1, 4, 1);
                } else if (this.direction.x === -1) { // 向左
                    ctx.fillRect(x - 8, y + size / 2 - 1, 8, 2);
                    ctx.fillRect(x - 8, y + size / 2 - 2, 4, 1);
                    ctx.fillRect(x - 8, y + size / 2 + 1, 4, 1);
                } else if (this.direction.y === -1) { // 向上
                    ctx.fillRect(x + size / 2 - 1, y - 8, 2, 8);
                    ctx.fillRect(x + size / 2 - 2, y - 8, 1, 4);
                    ctx.fillRect(x + size / 2 + 1, y - 8, 1, 4);
                } else { // 向下
                    ctx.fillRect(x + size / 2 - 1, y + size, 2, 8);
                    ctx.fillRect(x + size / 2 - 2, y + size + 4, 1, 4);
                    ctx.fillRect(x + size / 2 + 1, y + size + 4, 1, 4);
                }

                // 添加眼睛
                ctx.fillStyle = 'white';
                let eyeX1, eyeY1, eyeX2, eyeY2;
                if (this.direction.x === 1) {
                    eyeX1 = x + size - 4; eyeY1 = y + 4;
                    eyeX2 = x + size - 4; eyeY2 = y + size - 8;
                } else if (this.direction.x === -1) {
                    eyeX1 = x + 4; eyeY1 = y + 4;
                    eyeX2 = x + 4; eyeY2 = y + size - 8;
                } else if (this.direction.y === -1) {
                    eyeX1 = x + 4; eyeY1 = y + 4;
                    eyeX2 = x + size - 8; eyeY2 = y + 4;
                } else {
                    eyeX1 = x + 4; eyeY1 = y + size - 8;
                    eyeX2 = x + size - 8; eyeY2 = y + size - 8;
                }
                ctx.fillRect(eyeX1, eyeY1, 4, 4);
                ctx.fillRect(eyeX2, eyeY2, 4, 4);
            } else {
                // 繪製蛇身，顏色逐漸加深
                const colorIndex = Math.min(index - 1, this.bodyColors.length - 1);
                ctx.fillStyle = this.bodyColors[colorIndex];
                ctx.fillRect(x, y, size, size);
            }
        });
    }
}

class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        // 設定一般水果
        this.fruits = [
            { emoji: '🍎', score: 10, threshold: 0 },
            { emoji: '🍐', score: 15, threshold: 0 },
            { emoji: '🍊', score: 20, threshold: 50 },
            { emoji: '🍇', score: 25, threshold: 100 },
            { emoji: '🍉', score: 30, threshold: 200 },
            { emoji: '🍌', score: 35, threshold: 300 },
            { emoji: '🍓', score: 40, threshold: 400 },
            { emoji: '🍑', score: 50, threshold: 500 }
        ];

        // 設定特殊水果
        this.specialFruits = [
            {
                emoji: '⚡', // 閃電：加速
                score: 500,
                threshold: 2000,
                special: 'speed',
                effect: () => {
                    clearInterval(gameLoop);
                    gameLoop = setInterval(update, 66); // 原本100ms改為66ms，約1.5倍速
                    setTimeout(() => {
                        clearInterval(gameLoop);
                        gameLoop = setInterval(update, 100); // 10秒後恢復正常速度
                    }, 10000);
                }
            },
            {
                emoji: '🌟', // 星星：加長
                score: 200,
                threshold: 1500,
                special: 'grow',
                effect: () => {
                    snake.length += 5;
                }
            },
            {
                emoji: '✂️', // 剪刀：減半
                score: 100,
                threshold: 500,
                special: 'shrink',
                effect: () => {
                    snake.length = Math.max(1, Math.floor(snake.length / 2));
                    snake.positions = snake.positions.slice(0, snake.length);
                }
            }
        ];

        this.currentFruit = this.getRandomFruit();
        this.randomize();
    }

    getRandomFruit() {
        // 合併可用的普通水果和特殊水果
        const availableFruits = this.fruits.filter(fruit => score >= fruit.threshold);
        const availableSpecial = this.specialFruits.filter(fruit => score >= fruit.threshold);

        // 提高特殊水果的出現機率到 50%
        if (availableSpecial.length > 0 && Math.random() < 0.5) {
            // 從可用的特殊水果中隨機選擇一個
            return availableSpecial[Math.floor(Math.random() * availableSpecial.length)];
        }

        // 普通水果的選擇邏輯保持不變
        const weights = availableFruits.map(fruit => {
            const scoreDiff = score - fruit.threshold;
            return Math.max(1, 10 - Math.floor(scoreDiff / 50));
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < availableFruits.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return availableFruits[i];
            }
        }

        return availableFruits[0];
    }

    randomize() {
        this.position.x = Math.floor(Math.random() * GRID_WIDTH);
        this.position.y = Math.floor(Math.random() * GRID_HEIGHT);
        this.currentFruit = this.getRandomFruit();
    }

    draw() {
        if (!ctx) return;

        ctx.font = `${GRID_SIZE - 2}px Arial`;
        const x = this.position.x * GRID_SIZE + GRID_SIZE / 2;
        const y = this.position.y * GRID_SIZE + GRID_SIZE * 0.75;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(this.currentFruit.emoji, x, y);
    }
}

function startGame() {
    console.log('開始遊戲');
    startButton.style.display = 'none';

    if (gameLoop) {
        clearInterval(gameLoop);
    }

    snake = new Snake();
    food = new Food();
    score = 0;
    scoreElement.textContent = score;

    console.log('初始化完成');
    console.log('蛇的位置:', snake.positions);
    console.log('食物位置:', food.position);

    update(); // 立即執行一次更新
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
        // 如果是特殊水果，觸發特殊效果
        if (food.currentFruit.special) {
            food.currentFruit.effect();
        }
        snake.length++; // 一般成長效果
        score += food.currentFruit.score;
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
    initButtonPosition();
});

// 在文件底部添加事件監聽
document.getElementById('bgUpload').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        handleBackgroundImage(e.target.files[0]);
    }
});

// 計算逃跑方向
function calculateEscapeDirection(mouseX, mouseY, button) {
    // 使用視窗的可視區域
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const buttonRect = button.getBoundingClientRect();

    // 計算右下四分之一區域
    const quarterWidth = viewportWidth / 2;
    const quarterHeight = viewportHeight / 2;

    // 計算移動方向
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    const dx = buttonCenterX - mouseX;
    const dy = buttonCenterY - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 計算新位置，但限制在右下四分之一區域內
    let newX = buttonRect.left + (dx / distance) * 300;
    let newY = buttonRect.top + (dy / distance) * 300;

    // 確保按鈕保持在範圍內 
    newX = Math.min(Math.max(newX, quarterWidth), viewportWidth - buttonRect.width);
    newY = Math.min(Math.max(newY, quarterHeight), viewportHeight - buttonRect.height);

    return {
        x: newX - buttonRect.left,
        y: newY - buttonRect.top
    };
}

// 設置按鈕位置
function setButtonPosition(button, x, y) {
    button.style.transform = `translate(${x}px, ${y}px)`;
}

// 初始化按鈕位置
function initButtonPosition() {
    const container = surrenderBtn.parentElement;
    originalPosition = {
        x: 0,  // 保持在原位置
        y: 0
    };
    setButtonPosition(surrenderBtn, originalPosition.x, originalPosition.y);
}

// 監聽滑鼠移動
surrenderBtn.addEventListener('mouseover', function (e) {
    if (!isRunning) {
        isRunning = true;
        const escape = calculateEscapeDirection(e.clientX, e.clientY, this);

        setButtonPosition(this, escape.x, escape.y);
        surrenderText.style.opacity = '1';

        setTimeout(() => {
            setButtonPosition(this, originalPosition.x, originalPosition.y);
            surrenderText.style.opacity = '0';
            isRunning = false;
        }, 1000);
    }
});

// 確保視窗大小改變時重新計算位置
window.addEventListener('resize', () => {
    setButtonPosition(surrenderBtn, originalPosition.x, originalPosition.y);
});

// 添加結束遊戲函數
function endGame() {
    submitScore(score);
    if (gameLoop) {
        clearInterval(gameLoop);

        // 添加一些有趣的效果
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 清空畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 顯示遊戲結束文字
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('蛇麼事？', canvas.width / 2, canvas.height / 2);

        // 顯示分數
        ctx.font = '24px Arial';
        ctx.fillText(`最終分數：${score}`, canvas.width / 2, canvas.height / 2 + 50);
        // 重置遊戲狀態
        snake = null;
        food = null;
        score = 0;
        scoreElement.textContent = score;

        // 顯示開始按鈕
        startButton.style.display = 'block';
    }
}

// 修改標題按鈕的點擊處理
document.querySelector('.title-button').addEventListener('click', (e) => {
    clickCount++;

    // 清除之前的計時器
    if (clickTimer) {
        clearTimeout(clickTimer);
    }

    // 如果達到 5 次點擊
    if (clickCount >= 5) {
        endGame();
        clickCount = 0; // 重置計數器
        return;
    }

    // 設置新的計時器，1.5 秒後重置計數
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 1500);
});

// 添加櫻花效果控制
document.querySelector('.what-btn').addEventListener('click', () => {
    if (window.sakuraEffect) {
        window.sakuraEffect.toggle();
    }
});

// 修改 SakuraEffect 類的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 確保在其他遊戲初始化之後執行
    setTimeout(() => {
        window.sakuraEffect = new SakuraEffect();
    }, 100);
});

// 修改櫻花效果的實現，確保與遊戲邏輯完全分離
class SakuraEffect {
    constructor() {
        this.active = false; // 預設關閉
        // 創建獨立的容器
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);

        // 獲取遊戲區域
        this.gameCanvas = document.getElementById('gameCanvas');
        this.updateGameArea();

        // 綁定事件
        this.boundAnimate = this.animate.bind(this);
        window.addEventListener('resize', () => this.updateGameArea());

        // 開始動畫
        this.animate();
    }

    updateGameArea() {
        this.gameArea = this.gameCanvas.getBoundingClientRect();
    }

    createSakura() {
        if (!this.active) return;

        const sakura = document.createElement('div');
        sakura.style.cssText = `
            position: absolute;
            pointer-events: none;
            user-select: none;
            will-change: transform;
        `;
        sakura.textContent = '🌸';

        // 確保在遊戲區域外生成
        let startX;
        const padding = 50; // 與遊戲區域的安全距離
        if (Math.random() < 0.5) {
            startX = Math.random() * (this.gameArea.left - padding);
        } else {
            startX = this.gameArea.right + Math.random() * (window.innerWidth - this.gameArea.right - padding);
        }

        // 設置初始位置和樣式
        sakura.style.left = `${startX}px`;
        sakura.style.top = '-20px';
        sakura.style.fontSize = `${Math.random() * 10 + 10}px`;

        // 創建動畫
        const animation = sakura.animate([
            {
                transform: 'translate(0, 0) rotate(0deg)',
                opacity: 1
            },
            {
                transform: `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight + 20}px) rotate(360deg)`,
                opacity: 0
            }
        ], {
            duration: Math.random() * 3000 + 4000,
            easing: 'linear'
        });

        // 動畫結束後清理
        animation.onfinish = () => {
            sakura.remove();
        };

        this.container.appendChild(sakura);
    }

    animate() {
        if (this.active && Math.random() < 0.2) {
            this.createSakura();
        }
        requestAnimationFrame(this.boundAnimate);
    }

    toggle() {
        this.active = !this.active;
        if (!this.active) {
            // 清除所有櫻花
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        }
    }
}

// 全局點擊事件，讓設定視窗跟隨點擊位置
document.addEventListener('click', function (event) {
    // 如果點擊的不是設定視窗內的元素，且設定視窗已顯示
    const settingsBox = document.getElementById('settingsBox');
    if (!event.target.closest('#settingsBox') &&
        settingsBox.style.top !== '-200px' &&
        !event.target.closest('.settings-btn')) {
        // 移動設定視窗到新位置
        settingsBox.style.left = (event.clientX - 225) + "px";
        settingsBox.style.top = (event.clientY + 20) + "px";
    }
});

// 修改設定按鈕點擊事件
document.querySelector('.settings-btn').addEventListener('click', function (event) {
    const settingsBox = document.getElementById('settingsBox');
    settingsBox.style.display = 'block';  // 顯示視窗
    settingsBox.style.left = (event.clientX - 225) + "px";
    settingsBox.style.top = (event.clientY + 20) + "px";
    event.stopPropagation();
});

// 修改關閉按鈕點擊事件
document.getElementById('boxclose').addEventListener('click', function (event) {
    const settingsBox = document.getElementById('settingsBox');
    settingsBox.style.display = 'none';  // 完全隱藏視窗
    event.stopPropagation();
});

// 防止點擊設定框內部時觸發移動
document.getElementById('settingsBox').addEventListener('click', function (event) {
    event.stopPropagation();
});