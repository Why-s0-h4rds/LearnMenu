let currentMode = "кухня";
let totalQuestions = 5;
let currentQuestionIdx = 0;
let gameItems = [];
let targetIngredients = new Set();
let guessedIngredients = new Set();
let errorCount = 0;
let totalErrors = 0;

let kitchenIngredientsPool = new Set();
let barIngredientsPool = new Set();
let noCompositionPool = new Set();

// Вспомогательная функция перемешивания массива
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Выборка случайных элементов без повторений
function getRandomSample(arr, size) {
    let shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
}

// Подготовка пулов ингредиентов при загрузке страницы
function preparePools() {
    for (let dish in MENU_DATA["кухня"]) {
        MENU_DATA["кухня"][dish].forEach(i => kitchenIngredientsPool.add(i));
    }
    for (let drink in MENU_DATA["6ap"]) {
        if (drink === drink.toUpperCase()) {
            MENU_DATA["6ap"][drink].forEach(brand => noCompositionPool.add(brand));
        } else {
            MENU_DATA["6ap"][drink].forEach(i => barIngredientsPool.add(i));
        }
    }
    ALL_INGREDIENTS_POOL.forEach(item => {
        if (noCompositionPool.has(item)) return;
        let lower = item.toLowerCase();
        if (["ликер", "сироп", "ром", "водка", "джин", "сок", "пюре", "чай", "кофе", "нотки"].some(kw => lower.includes(kw))) {
            barIngredientsPool.add(item);
        } else {
            kitchenIngredientsPool.add(item);
        }
    });
    kitchenIngredientsPool = Array.from(kitchenIngredientsPool);
    barIngredientsPool = Array.from(barIngredientsPool);
    noCompositionPool = Array.from(noCompositionPool);
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById("btn-kitchen").classList.toggle("active", mode === "кухня");
    document.getElementById("btn-bar").classList.toggle("active", mode === "6ap");
    startGame();
}

function startGame() {
    let inputVal = parseInt(document.getElementById("questions-input").value);
    totalQuestions = isNaN(inputVal) ? 5 : Math.max(1, Math.min(20, inputVal));
    totalErrors = 0;
    errorCount = 0;
    
    let sourceData = MENU_DATA[currentMode];
    let allKeys = Object.keys(sourceData);
    
    gameItems = [];
    for(let i = 0; i < totalQuestions; i++) {
        let randKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        gameItems.push(randKey);
    }
    currentQuestionIdx = 0;
    nextQuestion();
}

function nextQuestion() {
    let grid = document.getElementById("grid-container");
    grid.innerHTML = "";
    errorCount = 0;
    updateErrors();
    
    if (currentQuestionIdx >= totalQuestions) {
        showFinalResults();
        return;
    }
    
    let itemName = gameItems[currentQuestionIdx];
    document.getElementById("lbl-item-name").innerText = itemName;
    document.getElementById("lbl-progress").innerText = `Позиция ${currentQuestionIdx + 1} из ${totalQuestions}`;
    
    let sourceData = MENU_DATA[currentMode];
    targetIngredients = new Set(sourceData[itemName]);
    guessedIngredients = new Set();
    updateRemains();
    
    let wrongPool = [];
    if (itemName === itemName.toUpperCase()) {
        document.getElementById("lbl-type").innerText = "Выберите входящие марки/сорта:";
        wrongPool = noCompositionPool.filter(x => !targetIngredients.has(x));
    } else {
        document.getElementById("lbl-type").innerText = "Соберите полный состав позиции:";
        let pool = (currentMode === "кухня") ? kitchenIngredientsPool : barIngredientsPool;
        wrongPool = pool.filter(x => !targetIngredients.has(x));
    }
    
    let neededDecoys = 20 - targetIngredients.size;
    let decoys = getRandomSample(wrongPool, Math.min(neededDecoys, wrongPool.length));
    let allOptions = Array.from(targetIngredients).concat(decoys);
    
    if (allOptions.length < 20) {
        let extra = ALL_INGREDIENTS_POOL.filter(x => !allOptions.includes(x));
        allOptions = allOptions.concat(getRandomSample(extra, 20 - allOptions.length));
    }
    allOptions = allOptions.slice(0, 20);
    shuffle(allOptions);
    
    allOptions.forEach(option => {
        let btn = document.createElement("button");
        btn.className = "ing-btn";
        btn.innerHTML = option;
        btn.onclick = () => handleClick(btn, option);
        grid.appendChild(btn);
    });
}

function handleClick(button, option) {
    if (targetIngredients.has(option)) {
        if (!guessedIngredients.has(option)) {
            guessedIngredients.add(option);
            button.classList.add("correct");
            updateRemains();
            if (guessedIngredients.size === targetIngredients.size) {
                currentQuestionIdx++;
                setTimeout(nextQuestion, 800);
            }
        }
    } else {
        totalErrors++;
        errorCount++;
        updateErrors();
        button.classList.add("wrong");
        setTimeout(() => {
            button.classList.remove("wrong");
        }, 400);
    }
}

function updateErrors() {
    document.getElementById("lbl-errors").innerText = `Ошибок: ${errorCount}`;
}

function updateRemains() {
    let remains = targetIngredients.size - guessedIngredients.size;
    document.getElementById("lbl-remains").innerText = `Осталось: ${remains}`;
}

function showFinalResults() {
    let grid = document.getElementById("grid-container");
    grid.innerHTML = "";
    
    let resultsDiv = document.createElement("div");
    resultsDiv.style.cssText = `
        text-align: center;
        padding: 25px 20px;
        background: white;
        border-radius: 12px;
        border: 2px solid #E2E8F0;
    `;
    
    let correctAnswers = totalQuestions;
    let totalClicks = totalErrors + totalQuestions;
    let accuracy = totalClicks > 0 ? Math.round((totalQuestions / totalClicks) * 100) : 0;
    
    let emoji = accuracy >= 80 ? '🏆' : accuracy >= 60 ? '👍' : '📚';
    let message = accuracy >= 80 ? 'Отличный результат!' : accuracy >= 60 ? 'Хороший результат!' : 'Нужно больше практики!';
    let subMessage = accuracy >= 80 ? 'Вы отлично знаете меню!' : accuracy >= 60 ? 'Продолжайте тренироваться!' : 'Попробуйте еще раз!';
    let color = accuracy >= 80 ? '#48BB78' : accuracy >= 60 ? '#ED8936' : '#F56565';
    
    resultsDiv.innerHTML = `
        <h2 style="color: #2D3748; margin-bottom: 20px;">📊 СЕССИЯ ЗАВЕРШЕНА!</h2>
        
        <div style="display: flex; justify-content: space-around; margin: 20px 0;">
            <div>
                <div style="font-size: 42px; font-weight: bold; color: #48BB78;">
                    ${correctAnswers}
                </div>
                <div style="color: #4A5568; font-size: 14px;">✅ Правильно</div>
            </div>
            <div>
                <div style="font-size: 42px; font-weight: bold; color: #F56565;">
                    ${totalErrors}
                </div>
                <div style="color: #4A5568; font-size: 14px;">❌ Ошибок</div>
            </div>
        </div>
        
        <div style="margin: 25px 0;">
            <div style="font-size: 52px; font-weight: bold; color: ${color};">
                ${accuracy}%
            </div>
            <div style="color: #4A5568; font-size: 16px;">Точность</div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #E2E8F0;">
            <div style="font-size: 20px; color: #2D3748;">
                ${emoji} ${message}
            </div>
            <div style="font-size: 14px; color: #718096; margin-top: 5px;">
                ${subMessage}
            </div>
        </div>
        
        <button onclick="startGame()" style="
            margin-top: 25px;
            padding: 14px 40px;
            background: #48BB78;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
        " onmouseover="this.style.background='#38A169'; this.style.transform='scale(1.02)'" 
           onmouseout="this.style.background='#48BB78'; this.style.transform='scale(1)'">
            🔄 Начать заново
        </button>
    `;
    
    grid.appendChild(resultsDiv);
    document.getElementById("lbl-item-name").innerText = "🎯 РЕЗУЛЬТАТЫ";
    document.getElementById("lbl-progress").innerText = `Завершено ${totalQuestions} вопросов`;
    document.getElementById("lbl-remains").innerText = "";
    document.getElementById("lbl-errors").innerText = "";
}

// Инициализация при загрузке
preparePools();
startGame();
