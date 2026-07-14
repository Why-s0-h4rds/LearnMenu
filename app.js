let currentMode = "кухня";
let totalQuestions = 5;
let currentQuestionIdx = 0;
let gameItems = [];
let targetIngredients = new Set();
let guessedIngredients = new Set();

let kitchenIngredientsPool = new Set();
let barIngredientsPool = new Set();
let noCompositionPool = new Set();

// Вспомогательная функция перемешивания массива (Аналог random.shuffle)
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
    for (let drink in MENU_DATA["бар"]) {
        if (drink === drink.toUpperCase()) {
            MENU_DATA["бар"][drink].forEach(brand => noCompositionPool.add(brand));
        } 
        else {
            MENU_DATA["бар"][drink].forEach(i => barIngredientsPool.add(i));
        }
    }

    ALL_INGREDIENTS_POOL.forEach(item => {
        if (noCompositionPool.has(item)) return;
        let lower = item.toLowerCase();
        if (["ликер", "сироп", "ром", "водка", "джин", "сок", "пюре", "чай", "кофе", "нотки"].some(kw => lower.includes(kw))) {
            barIngredientsPool.add(item);
        } 
        else {
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
    document.getElementById("btn-bar").classList.toggle("active", mode === "бар");
    startGame();
}

function startGame() {
    let inputVal = parseInt(document.getElementById("questions-input").value);
    totalQuestions = isNaN(inputVal) ? 5 : inputVal;

    let sourceData = MENU_DATA[currentMode];
    let allKeys = Object.keys(sourceData);

    // Генерируем случайный набор вопросов (random.choices)
    gameItems = [];
    for(let i=0; i < totalQuestions; i++) {
        let randKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        gameItems.push(randKey);
    }

    currentQuestionIdx = 0;
    nextQuestion();
}

function nextQuestion() {
    let grid = document.getElementById("grid-container");
    grid.innerHTML = "";

    if (currentQuestionIdx >= totalQuestions) {
        document.getElementById("lbl-item-name").innerText = "🏆 СЕССИЯ ОКОНЧЕНА!";
        document.getElementById("lbl-remains").innerText = "Осталось: 0";
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
    } 
    else {
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

    // Отрисовка кнопок
    allOptions.forEach(option => {
        let btn = document.createElement("button");
        btn.className = "ing-btn";
        btn.innerText = option;
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

            if (guessedIngredients.size === targetIngredients.size)  
            {
                currentQuestionIdx++;
                setTimeout(nextQuestion, 800); // Небольшая задержка перед следующим блюдом
            }
        }
    } 
    else {
        button.classList.add("wrong");
        setTimeout(() => {
        button.classList.remove("wrong");
        }, 400);
    }
}

function updateRemains() {
    let remains = targetIngredients.size - guessedIngredients.size;
    document.getElementById("lbl-remains").innerText = `Осталось: ${remains}`;
}

// Запуск при загрузке страницы
window.onload = () => {
    preparePools();
    startGame();
};