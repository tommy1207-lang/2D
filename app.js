// ================= 狀態管理 =================
const state = {
    player: { name: '蘇枋', hp: 150, maxHp: 150, baseAtk: 700 },
    boss: { name: '大魔王梅宮', hp: 10000, maxHp: 10000, baseAtk: 35 },
    cooldowns: { rm: 0, ctrlc: 0 },
    bossStunned: false,
    isProcessing: true, // 初始鎖定 UI，等待開場動畫結束
    gameOver: false
};

// ================= 工具函式 =================
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function logMsg(msg, color = 'var(--term-green)') {
    const logWindow = document.getElementById('log-window');
    const p = document.createElement('div');
    p.innerHTML = `> <span style="color:${color}">${msg}</span>`;
    logWindow.appendChild(p);
    logWindow.scrollTop = logWindow.scrollHeight; // 自動捲動到底部
}

// 強制重繪以重啟 CSS 動畫
function triggerAnimation(elementId, animClass) {
    const el = document.getElementById(elementId);
    el.classList.remove(animClass);
    void el.offsetWidth; // 觸發 reflow
    el.classList.add(animClass);
}

// ================= 開場前言 (Prologue) =================
async function typeWriter(text, elementId, speed = 50) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
        el.innerHTML += text.charAt(i);
        await sleep(speed);
    }
}

async function runPrologue() {
    const proScreen = document.getElementById('prologue-screen');
    const proImg = document.getElementById('prologue-image');
    
    // 玩家開場 (蘇枋)
    proImg.src = "https://raw.githubusercontent.com/tommy1207-lang/2D/main/%E8%98%87.png";
    proImg.className = "prologue-img img-player-glow";
    proImg.style.opacity = 1;
    await typeWriter("蘇枋敲擊著鍵盤... 這是一個再平常不過的 Debug 夜晚。", "prologue-text");
    await sleep(1500);
    
    // 切換魔王 (梅宮)
    proImg.style.opacity = 0;
    await sleep(1000);
    proImg.src = "https://raw.githubusercontent.com/tommy1207-lang/2D/main/%E6%A2%85.png";
    proImg.className = "prologue-img img-boss-glow";
    proImg.style.opacity = 1;
    await typeWriter("警告：不明惡意代碼入侵！大魔王梅宮已接管伺服器核心！", "prologue-text", 40);
    await sleep(2000);

    // 進入遊戲主畫面
    proScreen.style.opacity = 0;
    await sleep(1000);
    proScreen.style.display = 'none';
    
    const gameScreen = document.getElementById('game-screen');
    gameScreen.style.display = 'flex';
    void gameScreen.offsetWidth; // 確保 transition 生效
    gameScreen.style.opacity = 1;
    
    logMsg("系統：戰鬥開始！請選擇指令。", '#fff');
    state.isProcessing = false;
    updateUI();
}

// ================= 戰鬥與 UI 更新邏輯 =================
function updateUI() {
    // 防呆處理 HP 不小於 0
    state.player.hp = Math.max(0, state.player.hp);
    state.boss.hp = Math.max(0, state.boss.hp);

    // 更新 HP 條與文字
    const pPercent = (state.player.hp / state.player.maxHp) * 100;
    const bPercent = (state.boss.hp / state.boss.maxHp) * 100;
    
    document.getElementById('player-hp-bar').style.width = `${pPercent}%`;
    document.getElementById('player-hp-text').innerText = `${state.player.hp} / ${state.player.maxHp}`;
    
    document.getElementById('boss-hp-bar').style.width = `${bPercent}%`;
    document.getElementById('boss-hp-text').innerText = `${state.boss.hp} / ${state.boss.maxHp}`;

    // 更新按鈕狀態與 CD 文字
    document.getElementById('btn-attack').disabled = state.isProcessing || state.gameOver;
    document.getElementById('btn-heal').disabled = state.isProcessing || state.gameOver;
    
    const btnRm = document.getElementById('btn-rm');
    btnRm.disabled = state.isProcessing || state.cooldowns.rm > 0 || state.gameOver;
    btnRm.innerText = state.cooldowns.rm > 0 ? `sudo rm -rf / [CD: ${state.cooldowns.rm}]` : `sudo rm -rf /`;

    const btnCtrlc = document.getElementById('btn-ctrlc');
    btnCtrlc.disabled = state.isProcessing || state.cooldowns.ctrlc > 0 || state.gameOver;
    btnCtrlc.innerText = state.cooldowns.ctrlc > 0 ? `Ctrl+C [CD: ${state.cooldowns.ctrlc}]` : `Ctrl+C`;
}

// 執行攻擊的共用動畫函式
async function executeAttack(attackerId, targetId, damage, isBossTurn) {
    // 1. 衝刺動畫
    triggerAnimation(attackerId, isBossTurn ? 'anim-dash-boss' : 'anim-dash-player');
    await sleep(150); // 等待視覺上接近對手

    // 2. 扣血
    if (isBossTurn) {
        state.player.hp -= damage;
    } else {
        state.boss.hp -= damage;
    }
    updateUI();
    
    // 3. 敵方受擊亂碼動畫
    triggerAnimation(targetId, 'anim-glitch');
    await sleep(400); // 等待動畫播完
}

// 玩家回合選擇指令
async function playerAction(actionType) {
    if (state.isProcessing || state.gameOver) return;
    state.isProcessing = true;
    updateUI();

    let damage = 0;

    switch(actionType) {
        case 'attack':
            damage = state.player.baseAtk + Math.floor(Math.random() * 100) - 50; // 基礎浮動傷害
            logMsg(`蘇枋執行了 std::attack()，造成 ${damage} 點傷害。`);
            await executeAttack('player-img', 'boss-img', damage, false);
            break;
            
        case 'rm':
            damage = state.player.baseAtk * 3; // 高傷害暴擊
            state.cooldowns.rm = 3; // 設定為 3（回合結束時會 -1，所以下次玩家看到是 CD: 2）
            logMsg(`蘇枋使用 sudo rm -rf /！引發系統崩潰，造成 ${damage} 點暴擊傷害！`, '#ff0');
            await executeAttack('player-img', 'boss-img', damage, false);
            break;
            
        case 'ctrlc':
            damage = Math.floor(state.player.baseAtk * 0.2); // 微弱傷害
            state.bossStunned = true;
            state.cooldowns.ctrlc = 4; // 設定為 4（回合結束時 -1，下次玩家看到是 CD: 3）
            logMsg(`蘇枋送出 Ctrl+C 中斷訊號！造成 ${damage} 點傷害，梅宮進程被暫停 (暈眩 1 回合)！`, '#0ff');
            await executeAttack('player-img', 'boss-img', damage, false);
            break;
            
        case 'heal':
            const healAmount = 60;
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
            logMsg(`蘇枋呼叫 debug_heal()，恢復了 ${healAmount} 點 HP。`, '#0f0');
            await sleep(500); // 補血等待一下節奏
            break;
    }

    // 檢查輸贏
    if (await checkWinLose()) return;

    // 玩家回合結束，計算冷卻時間
    if (state.cooldowns.rm > 0) state.cooldowns.rm--;
    if (state.cooldowns.ctrlc > 0) state.cooldowns.ctrlc--;

    await sleep(500); // 攻守交替的節奏暫停
    await bossTurn();
}

// 魔王回合
async function bossTurn() {
    if (state.bossStunned) {
        logMsg(`大魔王梅宮處於暈眩狀態 (Process Stopped)，無法攻擊！`, '#aaa');
        state.bossStunned = false; // 解除暈眩
        await sleep(1000);
    } else {
        const damage = state.boss.baseAtk + Math.floor(Math.random() * 15);
        logMsg(`大魔王梅宮發動了記憶體覆寫攻擊！`, 'var(--boss-red)');
        await executeAttack('boss-img', 'player-img', damage, true);
        logMsg(`蘇枋受到 ${damage} 點傷害。`, '#ff8888');
    }

    // 檢查輸贏
    if (await checkWinLose()) return;

    // 輪回玩家
    logMsg(`輪到蘇枋輸入指令...`, '#fff');
    state.isProcessing = false;
    updateUI();
}

// 勝負判定
async function checkWinLose() {
    if (state.boss.hp <= 0) {
        state.gameOver = true;
        updateUI();
        logMsg(`大魔王梅宮的進程已被徹底終止。蘇枋獲勝！`, '#ff0');
        triggerAnimation('boss-img', 'anim-die');
        return true;
    }
    if (state.player.hp <= 0) {
        state.gameOver = true;
        updateUI();
        logMsg(`FATAL ERROR: 蘇枋的生命週期結束。系統崩潰。`, 'var(--boss-red)');
        triggerAnimation('player-img', 'anim-die');
        return true;
    }
    return false;
}

// 啟動遊戲
window.onload = () => {
    runPrologue();
};