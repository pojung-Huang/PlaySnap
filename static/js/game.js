const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const lengthElement = document.getElementById('lengthValue');
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

const GRID_SIZE = Math.floor(canvas.height / 30);
const GRID_WIDTH = Math.floor(canvas.width / GRID_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / GRID_SIZE);

let snake = null;
let food = null;
let gameLoop = null;
let score = 0;

let youtubePlayer = null;
let isMuted = false;

// 蛇類 顏色&方向
class Snake {
    // 初始化 位置&方向&長度&是否改變方向&身體顏色
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

        // 更新蛇頭位置
        const head = this.positions[0];
        const newHead = {
            x: (head.x + this.direction.x + GRID_WIDTH) % GRID_WIDTH,
            y: (head.y + this.direction.y + GRID_HEIGHT) % GRID_HEIGHT
        };

        // 檢查是否撞到自己
        if (this.positions.some(pos => pos.x === newHead.x && pos.y === newHead.y)) {
            return false;
        }

        // 更新蛇的位置
        this.positions.unshift(newHead);
        if (this.positions.length > this.length) {
            this.positions.pop();
        }
        return true;
    }

    // 繪製蛇
    draw() {
        // 確保有正確的繪圖上下文
        if (!ctx) return;

        // 繪製蛇身
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

// 新增特殊水果特效
class SpecialEffect {
    // 初始化 特效&容器&動畫&粒子&特效
    constructor(emoji) {
        this.active = true;
        this.emoji = emoji;
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);

        this.animate = this.animate.bind(this);
        this.createParticle = this.createParticle.bind(this);

        // 開始動畫
        this.animate();

        // 5秒後自動停止
        setTimeout(() => {
            this.active = false;
            setTimeout(() => {
                this.container.remove();
            }, 3000); // 給最後的粒子時間落下
        }, 5000);
    }

    // 創建粒子
    createParticle() {
        if (!this.active) return;

        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            user-select: none;
            will-change: transform;
            z-index: 1;
            font-size: ${Math.random() * 20 + 10}px;
        `;
        particle.textContent = this.emoji;

        // 隨機起始位置（從頂部開始）
        const startX = Math.random() * window.innerWidth;
        particle.style.left = `${startX}px`;
        particle.style.top = '-20px';

        // 創建動畫
        const animation = particle.animate([
            {
                transform: 'translate(0, 0) rotate(0deg)',
                opacity: 1
            },
            {
                transform: `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight + 20}px) rotate(${Math.random() * 360}deg)`,
                opacity: 0
            }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'linear'
        });

        // 動畫結束後移除粒子
        animation.onfinish = () => particle.remove();

        this.container.appendChild(particle);
    }

    // 動畫
    animate() {
        if (this.active && Math.random() < 0.3) {
            this.createParticle();
        }
        requestAnimationFrame(this.animate);
    }
}

// 新增食物類別
class Food {
    // 初始化 位置&水果&特殊水果
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
                emoji: '⚡',
                score: 100,
                threshold: 120,
                special: 'speed',
                effect: () => {
                    new SpecialEffect('⚡'); // 添加特效
                    clearInterval(gameLoop);
                    gameLoop = setInterval(update, 66);
                    setTimeout(() => {
                        clearInterval(gameLoop);
                        gameLoop = setInterval(update, 100);
                    }, 10000);
                }
            },
            {
                emoji: '🌟',
                score: 100,
                threshold: 100,
                special: 'grow',
                effect: () => {
                    new SpecialEffect('🌟'); // 添加特效
                    snake.length += 5;
                }
            },
            {
                emoji: '✂️',
                score: 100,
                threshold: 200,
                special: 'shrink',
                effect: () => {
                    new SpecialEffect('✂️'); // 添加特效
                    snake.length = Math.max(1, Math.floor(snake.length * 0.85));
                    snake.positions = snake.positions.slice(0, snake.length);

                    // 更新長度顯示
                    document.getElementById('lengthValue').textContent = snake.length;
                }
            }
        ];

        this.currentFruit = this.getRandomFruit();
        this.randomize();
    }

    // 水果出現全重控制
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

    // 隨機選擇水果
    randomize() {
        this.position.x = Math.floor(Math.random() * GRID_WIDTH);
        this.position.y = Math.floor(Math.random() * GRID_HEIGHT);
        this.currentFruit = this.getRandomFruit();
    }

    // 繪製水果
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

// 新增遊戲開始函數
function startGame() {
    console.log('開始遊戲');
    startButton.style.display = 'none';

    if (gameLoop) {
        clearInterval(gameLoop);
    }

    snake = new Snake();
    food = new Food();
    score = 0;
    console.log('分數000:', score);
    scoreElement.textContent = score;
    console.log('分數:', score);

    // 初始化長度顯示
    const lengthElement = document.getElementById('lengthValue');
    lengthElement.textContent = snake.length;

    console.log('初始化完成');
    console.log('蛇的位置:', snake.positions);
    console.log('食物位置:', food.position);

    update(); // 立即執行一次更新
    gameLoop = setInterval(update, 100);
}

// 更新排行榜
async function updateLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const leaderboard = await response.json();
        const leaderboardList = document.querySelector('.leaderboard-list');

        leaderboardList.innerHTML = leaderboard
            .map((entry, index) => {
                // 決定排名圖標和樣式
                let rankIcon;
                let rankClass;
                let rankNumber = index + 1;  // 保留排名數字

                if (index === 0) {
                    rankIcon = '🥇';
                    rankClass = 'rank-gold';
                } else if (index === 1) {
                    rankIcon = '🥈';
                    rankClass = 'rank-silver';
                } else if (index === 2) {
                    rankIcon = '🥉';
                    rankClass = 'rank-bronze';
                } else {
                    // 第四名之後使用獎牌+序數後綴
                    const suffix = 'ᵗʰ';  // 預設後綴
                    rankIcon = `🏅${rankNumber}${suffix}`;
                    rankClass = '';
                }

                return `
                    <li class="leaderboard-item ${rankClass}">
                        <div>
                            <span class="rank-icon ${rankClass}">${rankIcon}</span>
                            <span>${entry.name}</span>
                        </div>
                        <span>${entry.score}分 長度: ${entry.length}</span>
                    </li>
                `;
            })
            .join('');

        // 更新當前玩家的分數和排名
        if (snake) {
            const currentScore = score;
            const currentRank = leaderboard.findIndex(entry => entry.score < currentScore) + 1;
            document.getElementById('currentRank').textContent =
                currentRank > 0 ? currentRank : leaderboard.length + 1;
        }

    } catch (error) {
        console.error('更新排行榜失敗:', error);
    }
}

// 新增提交分數函數
async function submitScore(score) {
    const name = prompt('恭喜！請輸入您的名字：');
    if (name) {
        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    score,
                    length: snake.length  // 添加長度資訊
                }),
            });
            await updateLeaderboard();  // 確保在提交分數後立即更新排行榜
        } catch (error) {
            console.error('提交分數失敗:', error);
        }
    }
}

// 新增輔助線繪製函數
function drawGuidelines() {
    ctx.save();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;

    // 繪製水平輔助線
    for (let i = 0; i < GRID_HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // 繪製垂直輔助線
    for (let i = 0; i < GRID_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
    }

    ctx.restore();
}

// 修改 update 函數
function update() {
    // 1. 先清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 繪製背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGuidelines(); // 添加輔助線繪製

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

        // 更新長度顯示
        document.getElementById('lengthValue').textContent = snake.length;

        food.randomize();
    }

    // 5. 繪製蛇和食物
    snake.draw();
    food.draw();
}

// 新增按鍵事件處理
document.addEventListener('keydown', (event) => {
    const key = event.key;
    console.log('按鍵', snake.direction);
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

    const toggleGuidelines = document.getElementById('toggleGuidelines');
    if (toggleGuidelines) {
        toggleGuidelines.addEventListener('change', function () {
            showGuidelines = this.checked;
        });
    }
});

// 添加結束遊戲函數
function endGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
        submitScore(score);  // 提交分數
        updateLeaderboard(); // 立即更新排行榜顯示

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
        lengthElement.textContent = length;

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

    // 更新遊戲區域
    updateGameArea() {
        this.gameArea = this.gameCanvas.getBoundingClientRect();
    }

    // 創建櫻花
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

    // 櫻花動畫
    animate() {
        if (this.active && Math.random() < 0.2) {
            this.createSakura();
        }
        requestAnimationFrame(this.boundAnimate);
    }

    // 櫻花開關
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


// 全局點擊事件，讓 音樂設定 視窗跟隨點擊位置
document.addEventListener('click', function (event) {
    // 如果點擊的不是設定視窗內的元素，且設定視窗已顯示
    const musicSettingsBox = document.getElementById('MusicSettingsBox');
    // 如果點擊的不是設定視窗內的元素，且設定視窗已顯示
    if (!event.target.closest('#MusicSettingsBox') &&
        musicSettingsBox.style.top !== '-200px' &&
        !event.target.closest('.MusicSettingsBTN')) {
        // 移動設定視窗到新位置
        musicSettingsBox.style.left = (event.clientX - 225) + "px";
        musicSettingsBox.style.top = (event.clientY + 20) + "px";
    }
});

// 修改 音樂設定 按鈕點擊事件
document.querySelector('.MusicSettingsBTN').addEventListener('click', function (event) {
    const musicSettingsBox = document.getElementById('MusicSettingsBox');
    musicSettingsBox.style.display = 'block';  // 顯示視窗
    musicSettingsBox.style.left = (event.clientX - 225) + "px";
    musicSettingsBox.style.top = (event.clientY + 20) + "px";
    event.stopPropagation();
});

// 修改關閉 音樂設定 按鈕點擊事件
document.getElementById('MusicSettingsBoxClose').addEventListener('click', function (event) {
    const settingsBox = document.getElementById('MusicSettingsBox');
    settingsBox.style.display = 'none';  // 完全隱藏視窗
    event.stopPropagation();
});

// 全局點擊事件，讓 排行榜 視窗跟隨點擊位置
document.addEventListener('click', function (event) {
    // 如果點擊的不是設定視窗內的元素，且設定視窗已顯示
    const leaderboardBox = document.getElementById('LeaderboardBox');
    if (!event.target.closest('#LeaderboardBox') &&
        leaderboardBox.style.top !== '-200px' &&
        !event.target.closest('.LeaderboardBTN')) {
        // 移動排行榜視窗到新位置
        leaderboardBox.style.left = (event.clientX - 225) + "px";
    }
});

// 修改 排行榜 按鈕點擊事件
document.querySelector('.LeaderboardBTN').addEventListener('click', function (event) {
    const leaderboardBox = document.getElementById('LeaderboardBox');
    leaderboardBox.style.display = 'block';
    leaderboardBox.style.left = (event.clientX - 225) + "px";
    leaderboardBox.style.top = (event.clientY + 20) + "px";
    event.stopPropagation();
});

// 修改關閉 排行榜 按鈕點擊事件
document.getElementById('LeaderboardBoxClose').addEventListener('click', function (event) {
    const leaderboardBox = document.getElementById('LeaderboardBox');
    leaderboardBox.style.display = 'none';  // 完全隱藏視窗
    event.stopPropagation();
});

// 防止點擊 排行榜 框內部時觸發移動
document.getElementById('LeaderboardBox').addEventListener('click', function (event) {
    event.stopPropagation();
});

// 全局點擊事件，讓 遊戲規則 視窗跟隨點擊位置
document.addEventListener('click', function (event) {
    // 如果點擊的不是設定視窗內的元素，且設定視窗已顯示
    const gameRulesBox = document.getElementById('GameRulesBox');
    if (!event.target.closest('#GameRulesBox') &&
        gameRulesBox.style.top !== '-200px' &&
        !event.target.closest('.GameRulesBTN')) {
        // 移動遊戲規則視窗到新位置
        gameRulesBox.style.left = (event.clientX - 225) + "px";
    }
});

// 修改 遊戲規則 按鈕點擊事件
document.querySelector('.GameRulesBTN').addEventListener('click', function (event) {
    const gameRulesBox = document.getElementById('GameRulesBox');
    gameRulesBox.style.display = 'block';
    gameRulesBox.style.left = (event.clientX - 225) + "px";
    gameRulesBox.style.top = (event.clientY + 20) + "px";
    event.stopPropagation();
});

// 修改關閉 遊戲規則 按鈕點擊事件
document.getElementById('GameRulesBoxClose').addEventListener('click', function (event) {
    const gameRulesBox = document.getElementById('GameRulesBox');
    gameRulesBox.style.display = 'none';  // 完全隱藏視窗
    event.stopPropagation();
});

// 防止點擊 遊戲規則 框內部時觸發移動
document.getElementById('GameRulesBox').addEventListener('click', function (event) {
    event.stopPropagation();
});

// 添加蛇按鈕特效類
class SnakeEffect {
    // 初始化 容器&特效&計數器
    constructor() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);

        setTimeout(() => {
            this.container.remove();
        }, 8000);
    }

    // 創建蛇
    createSnake(x, y) {
        const snake = document.createElement('div');
        snake.textContent = '🐍';
        snake.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            font-size: ${Math.random() * 20 + 20}px;
            transform-origin: center;
            user-select: none;
            z-index: 1000;
        `;

        // 均勻分布的角度
        const angleStep = (Math.PI * 2) / 30; // 將360度平均分成30份
        const angleOffset = Math.random() * angleStep; // 添加隨機偏移
        const angle = (this.snakeCount * angleStep) + angleOffset;

        // 隨機化初始速度，但保持最小速度
        const minSpeed = 15;
        const maxSpeed = 25;
        const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;

        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        let posX = 0;
        let posY = 0;
        let rotation = 0;
        let bounceCount = 0; // 記錄反彈次數

        const maxX = window.innerWidth - snake.offsetWidth;
        const maxY = window.innerHeight - snake.offsetHeight;

        const animate = () => {
            posX += vx;
            posY += vy;

            // 減小重力效果
            vy += 0.2;

            // 改進的邊界碰撞處理
            if (posX < 0) {
                posX = 0;
                vx = Math.abs(vx) * 0.85;
                rotation += Math.random() * 360; // 隨機旋轉
                bounceCount++;
            }
            if (posX > maxX) {
                posX = maxX;
                vx = -Math.abs(vx) * 0.85;
                rotation += Math.random() * 360;
                bounceCount++;
            }
            if (posY < 0) {
                posY = 0;
                vy = Math.abs(vy) * 0.85;
                rotation += Math.random() * 360;
                bounceCount++;
            }
            if (posY > maxY) {
                posY = maxY;
                vy = -Math.abs(vy) * 0.85;
                rotation += Math.random() * 360;
                bounceCount++;
            }

            // 更新位置和旋轉
            snake.style.transform = `translate(${posX}px, ${posY}px) rotate(${rotation}deg)`;

            // 計算當前速度
            const currentSpeed = Math.sqrt(vx * vx + vy * vy);

            // 根據反彈次數和速度決定是否繼續動畫
            if (currentSpeed > 0.5 && bounceCount < 5) {
                requestAnimationFrame(animate);
            } else {
                // 淡出效果
                snake.style.transition = 'opacity 0.8s';
                snake.style.opacity = '0';
                setTimeout(() => snake.remove(), 800);
            }
        };

        this.container.appendChild(snake);
        requestAnimationFrame(animate);
    }
}

// 修改蛇按鈕的點擊事件
document.querySelector('.snake-btn').addEventListener('click', (e) => {
    const effect = new SnakeEffect();
    effect.snakeCount = 0; // 初始化計數器

    // 使用 requestAnimationFrame 來創建蛇，使動畫更流暢
    const createSnakes = () => {
        if (effect.snakeCount < 30) {
            effect.createSnake(e.clientX, e.clientY);
            effect.snakeCount++;
            requestAnimationFrame(createSnakes);
        }
    };
    createSnakes();
});

// 獲取 YouTube 影片 ID
function getYoutubeVideoId(input) {
    // 處理 iframe 代碼
    if (input.includes('iframe')) {
        const srcMatch = input.match(/embed\/([^?"]+)/);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1];
        }
    }

    // 處理一般 URL
    const urlMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
    }

    // 處理純 ID
    if (input.match(/^[a-zA-Z0-9_-]{11}$/)) {
        return input;
    }

    return null;
}

// 設置 YouTube 背景
function setYoutubeBackground() {
    const input = document.getElementById('youtubeUrl').value.trim();
    const videoId = getYoutubeVideoId(input);

    if (!videoId) {
        alert('請輸入有效的 YouTube 網址或影片 ID');
        return;
    }

    // 移除舊的播放器
    const oldPlayer = document.getElementById('youtubePlayer');
    if (oldPlayer) {
        oldPlayer.remove();
    }

    // 創建容器
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtubePlayer';
    playerDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;

    // 添加到畫布容器
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.insertBefore(playerDiv, canvasContainer.firstChild);

    // 創建 YouTube 播放器
    youtubePlayer = new YT.Player('youtubePlayer', {
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'loop': 1,
            'playlist': videoId,
            'modestbranding': 1,
            'mute': 0,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player Ready');
    event.target.playVideo();
}

// 播放狀態改變
function onPlayerStateChange(event) {
    console.log('Player State Changed:', event.data);
}

// 播放錯誤
function onPlayerError(event) {
    console.error('Player Error:', event.data);
}

// 播放控制函數
function playVideo() {
    if (youtubePlayer && youtubePlayer.playVideo) {
        youtubePlayer.playVideo();
    }
}

// 暫停影片
function pauseVideo() {
    if (youtubePlayer && youtubePlayer.pauseVideo) {
        youtubePlayer.pauseVideo();
    }
}

// 靜音開關
function toggleMute() {
    if (youtubePlayer) {
        if (youtubePlayer.isMuted()) {
            youtubePlayer.unMute();
            document.getElementById('muteButton').textContent = '靜音 🔇';
        } else {
            youtubePlayer.mute();
            document.getElementById('muteButton').textContent = '取消靜音 🔊';
        }
    }
}

// 重置 YouTube 背景
function resetYoutubeBackground() {
    const player = document.getElementById('youtubePlayer');
    if (player) {
        player.remove();
    }
    youtubePlayer = null;
    document.getElementById('youtubeUrl').value = '';
}
