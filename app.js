// ==========================================
// 1. НАСТРОЙКИ СЕТКИ И ГЛОБАЛЬНЫЕ ДАННЫЕ
// ==========================================
const timeGrid = document.getElementById('time-grid');
const timeGridContainer = document.getElementById('time-grid-container');
const monthGrid = document.getElementById('month-grid');
const START_HOUR = 0;   
const END_HOUR = 23;    
const PIXELS_PER_HOUR = 60;

let currentView = 'week'; 
let selectedDate = new Date(); 

let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let plannerTasks = JSON.parse(localStorage.getItem('plannerTasks')) || [];

// МИГРАЦИЯ: Выдаем всем старым задачам уникальные ID, если их нет
plannerTasks.forEach(task => {
    if (!task.id) task.id = 't_' + Math.random().toString(36).substr(2, 9);
});
localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));

const btnDay = document.getElementById('view-day');
const btnWeek = document.getElementById('view-week');
const btnMonth = document.getElementById('view-month');

function updateViewMode(mode, activeBtn) {
    currentView = mode;
    [btnDay, btnWeek, btnMonth].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    
    const daysHeader = document.querySelector('.days-header');
    
    if (currentView === 'month') {
        timeGridContainer.style.display = 'none';
        daysHeader.style.display = 'none'; // <--- Прячем старую шапку
        monthGrid.style.display = 'grid';
    } else {
        timeGridContainer.style.display = 'block';
        daysHeader.style.display = 'flex'; // <--- Возвращаем шапку для Дня/Недели
        monthGrid.style.display = 'none';
    }

    if (currentView === 'week') {
        daysHeader.style.minWidth = '750px';
        timeGridContainer.style.minWidth = '750px';
    } else {
        daysHeader.style.minWidth = '100%';
        timeGridContainer.style.minWidth = '100%';
    }

    updateDateLabel(); 
    renderHeader();
    if (currentView === 'month') {
        renderMonthGrid();
    } else {
        renderGrid();
    }
    renderAllTasks();
}

btnDay.addEventListener('click', () => updateViewMode('day', btnDay));
btnWeek.addEventListener('click', () => updateViewMode('week', btnWeek));
// УРА! Снимаем заглушку с кнопки месяца!
btnMonth.addEventListener('click', () => updateViewMode('month', btnMonth));

// === НОВЫЙ КОД ВСТАВЛЯЕМ СЮДА ===
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dateLabel = document.getElementById('current-date-label');

function updateDateLabel() {
    if (currentView === 'day') {
        dateLabel.textContent = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (currentView === 'week') {
        const mon = getMonday(selectedDate);
        const sun = new Date(mon);
        sun.setDate(sun.getDate() + 6);
        dateLabel.textContent = `${mon.getDate()} - ${sun.getDate()} ${sun.toLocaleDateString('ru-RU', { month: 'long' })}`;
    } else if (currentView === 'month') {
        dateLabel.textContent = selectedDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
}

function changeDate(offset) {
    if (currentView === 'day') {
        selectedDate.setDate(selectedDate.getDate() + offset);
    } else if (currentView === 'week') {
        selectedDate.setDate(selectedDate.getDate() + (offset * 7));
    } else if (currentView === 'month') {
        selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1);
    }
    
    updateDateLabel();
    renderHeader();
    if (currentView === 'month') {
        renderMonthGrid();
    } else {
        renderGrid();
    }
    renderAllTasks();
}

prevBtn.addEventListener('click', () => changeDate(-1));
nextBtn.addEventListener('click', () => changeDate(1));
// === КОНЕЦ НОВОГО КОДА ===

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// ==========================================
// 2. ОТРИСОВКА ШАПКИ, СЕТКИ И ЗАДАЧ
// ==========================================

function renderHeader() {
    const headerContainer = document.querySelector('.days-header');
    // В месяце нет колонки с часами, поэтому убираем отступ слева
    headerContainer.innerHTML = currentView === 'month' ? '' : '<div class="time-spacer"></div>'; 

    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    if (currentView === 'day') {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-col current-day';
        dayDiv.style.flex = '1'; 
        dayDiv.textContent = `${daysOfWeek[selectedDate.getDay()]}, ${selectedDate.getDate()}`;
        headerContainer.appendChild(dayDiv);
    } else if (currentView === 'week') {
        const monday = getMonday(selectedDate);
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            let nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-col';
            if (nextDay.toDateString() === today.toDateString()) {
                dayDiv.classList.add('current-day');
            }
            dayDiv.textContent = `${daysOfWeek[nextDay.getDay()]}, ${nextDay.getDate()}`;
            headerContainer.appendChild(dayDiv);
        }
    } else if (currentView === 'month') {
        // Для месяца просто выводим ровную шапку "Пн Вт Ср Чт Пт Сб Вс"
        const weekDaysOnly = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekDaysOnly.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-col';
            dayDiv.textContent = day;
            headerContainer.appendChild(dayDiv);
        });
    }
}

function renderGrid() {
    timeGrid.innerHTML = ''; 
    const totalHours = END_HOUR - START_HOUR + 1;
    timeGrid.style.height = `${totalHours * PIXELS_PER_HOUR}px`;

    for (let i = 0; i < totalHours; i++) {
        const currentHour = START_HOUR + i;
        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = `${currentHour.toString().padStart(2, '0')}:00`;
        hourLabel.style.top = `${i * PIXELS_PER_HOUR}px`;
        timeGrid.appendChild(hourLabel);
    }
}

// НОВАЯ ФУНКЦИЯ: Рисуем 30 квадратиков для месяца
function renderMonthGrid() {
    monthGrid.innerHTML = '';
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // === НОВЫЙ БЛОК: РИСУЕМ ШАПКУ ВНУТРИ СЕТКИ ===
    const weekDaysOnly = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekDaysOnly.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'month-header-cell';
        headerCell.textContent = day;
        monthGrid.appendChild(headerCell);
    });    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Высчитываем, с какого дня недели начинается месяц (чтобы добавить пустые ячейки)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'month-cell';
        emptyCell.style.backgroundColor = '#f9fafb';
        monthGrid.appendChild(emptyCell);
    }
    
    const todayStr = (new Date(new Date() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    // Рисуем сами дни
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const cell = document.createElement('div');
        cell.className = 'month-cell';
        // Приклеиваем к ячейке дату, чтобы ИИ знал, куда класть карточки
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'month-cell-date';
        dateLabel.textContent = d;
        
        if (dateStr === todayStr) {
            dateLabel.style.color = '#3b82f6';
            dateLabel.style.fontWeight = '900';
            cell.style.backgroundColor = '#eff6ff'; // Подсвечиваем сегодняшний день
        }
        
        cell.appendChild(dateLabel);
        monthGrid.appendChild(cell);
    }
}

function renderAllTasks() {
    // Чистим старые карточки обоих типов
    document.querySelectorAll('.task-card, .month-task').forEach(el => el.remove());

    const offset = selectedDate.getTimezoneOffset() * 60000;
    const selectedDateStr = (new Date(selectedDate - offset)).toISOString().split('T')[0];
    
    const monday = getMonday(selectedDate);
    const weekDates = [];
    for(let i = 0; i < 7; i++) {
        let nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        const ndOffset = nextDay.getTimezoneOffset() * 60000;
        weekDates.push((new Date(nextDay - ndOffset)).toISOString().split('T')[0]);
    }

    plannerTasks.forEach((task, index) => {
        // === БРОНЯ ОТ ОШИБОК И ПУСТЫХ ДАННЫХ ИЗ ИИ ===
        const sHour = (task.startHour !== null && task.startHour !== undefined) ? task.startHour : 0;
        const sMin = (task.startMinute !== null && task.startMinute !== undefined) ? task.startMinute : 0;
        const tDate = task.date || selectedDateStr;
        const tDur = task.durationMinutes || 60;
        const tTitle = task.title || 'Без названия';

        const startMins = sHour * 60 + sMin;
        const endMins = startMins + tDur;

        let segments = [];
        if (endMins <= 1440) { 
            segments.push({ date: tDate, startMins: startMins, duration: tDur, isContinuation: false });
        } else {
            const part1Duration = 1440 - startMins; 
            const part2Duration = endMins - 1440;   
            const [y, m, d] = tDate.split('-');
            const nextDateObj = new Date(y, m - 1, parseInt(d) + 1);
            const ndOffset = nextDateObj.getTimezoneOffset() * 60000;
            const nextDateStr = (new Date(nextDateObj - ndOffset)).toISOString().split('T')[0];

            segments.push({ date: tDate, startMins: startMins, duration: part1Duration, isContinuation: false });
            segments.push({ date: nextDateStr, startMins: 0, duration: part2Duration, isContinuation: true });
        }

        segments.forEach(seg => {
            const isCustom = customCategories.find(c => c.id === task.category);
            const categoryName = isCustom ? isCustom.name : (task.category === 'study' ? 'Учеба' : task.category === 'work' ? 'Работа' : 'Личное');
            
            const bgColor = isCustom ? isCustom.color : (task.category === 'study' ? '#f59e0b' : task.category === 'work' ? '#10b981' : '#8b5cf6');

            // Генерируем значки важности
            let priorityHtml = '';
            if (task.priority === 'high') priorityHtml = '<span class="priority-high">!!!</span>';
            else if (task.priority === 'medium') priorityHtml = '<span class="priority-med">!</span>';

            // === ОТРИСОВКА МЕСЯЦА ===
            if (currentView === 'month') {
                const targetCell = document.querySelector(`.month-cell[data-date="${seg.date}"]`);
                if (targetCell) {
                    const monthTaskEl = document.createElement('div');
                    monthTaskEl.className = `month-task ${task.isDone ? 'done' : ''} ${task.priority === 'high' ? 'priority-high-card' : ''}`;
                    monthTaskEl.style.backgroundColor = bgColor;
                    
                    const titleText = seg.isContinuation ? `${tTitle} (продолж.)` : `${sHour.toString().padStart(2, '0')}:${sMin.toString().padStart(2, '0')} ${tTitle}`;
                    monthTaskEl.innerHTML = `${priorityHtml} ${titleText}`;
                    
                    monthTaskEl.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        if (e.target.classList.contains('task-checkbox')) return;
                        openTaskModal(task, index);
                    });
                    
                    targetCell.appendChild(monthTaskEl);
                }
                return; 
            }

            // === ОТРИСОВКА ДНЯ И НЕДЕЛИ ===
            let isVisible = false;
            let displayColumnIndex = 0;

            if (currentView === 'day') {
                if (seg.date === selectedDateStr) {
                    isVisible = true;
                    displayColumnIndex = 0; 
                }
            } else if (currentView === 'week') {
                const dayIndexInWeek = weekDates.indexOf(seg.date);
                if (dayIndexInWeek !== -1) {
                    isVisible = true;
                    displayColumnIndex = dayIndexInWeek;
                }
            }

            if (!isVisible) return; 

            const taskEl = document.createElement('div');
            taskEl.className = `task-card ${isCustom ? '' : 'cat-'+task.category} ${task.priority === 'high' ? 'priority-high-card' : ''}`;
            if (isCustom) taskEl.style.backgroundColor = isCustom.color;
            if (task.isDone) taskEl.classList.add('done');
            
            const topPosition = (seg.startMins / 60 - START_HOUR) * PIXELS_PER_HOUR;
            const height = (seg.duration / 60) * PIXELS_PER_HOUR;
            
            taskEl.style.top = `${topPosition}px`;
            taskEl.style.height = `${height}px`;
            
            if (currentView === 'day') {
                taskEl.style.left = `50px`;
                taskEl.style.width = `calc(100% - 54px)`;
                taskEl.classList.add('task-card-large'); 
            } else {
                taskEl.style.left = `calc(50px + (100% - 50px) / 7 * ${displayColumnIndex})`;
                taskEl.style.width = `calc((100% - 50px) / 7 - 4px)`;
            }
            
            const titleText = seg.isContinuation ? `${tTitle} (продолж.)` : tTitle;
            const timeText = seg.isContinuation ? `00:00 (${seg.duration} мин)` : `${sHour.toString().padStart(2, '0')}:${sMin.toString().padStart(2, '0')} (${seg.duration} мин)`;

            taskEl.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="task-category-label" style="font-size: 10px; opacity: 0.8; font-weight: bold;">[${categoryName}]</span>
                    <input type="checkbox" class="task-checkbox" ${task.isDone ? 'checked' : ''}>
                </div>
                <div class="task-title" style="font-weight: 500;">${priorityHtml} ${titleText}</div>
                <div class="task-time" style="font-size: 11px;">${timeText}</div>
            `;
            
            const checkbox = taskEl.querySelector('.task-checkbox');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation(); 
                task.isDone = checkbox.checked; 
                localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks)); 
                renderAllTasks(); 
            });
            
            taskEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('task-checkbox')) return; 
                openTaskModal(task, index);
            });

            timeGrid.appendChild(taskEl);
        });
    });
}

// Запускаем отрисовку при старте
updateDateLabel(); // <--- ДОБАВИЛИ ЭТУ СТРОЧКУ
renderHeader();
renderGrid();
renderAllTasks();

// ==========================================
// 3. ДОБАВЛЕНИЕ НОВЫХ ТЕМ (ШЕСТЕРЕНКА)
// ==========================================
const settingsBtn = document.getElementById('settings-btn');

settingsBtn.addEventListener('click', () => {
    const name = prompt("Название новой темы (например: Спорт, Ремонт):");
    if (!name) return;
    
    const keywords = prompt(`Слова-триггеры для темы "${name}" через запятую:`);
    if (!keywords) return;

    const color = prompt(`Цвет карточки (на английском или HEX). Например: orange, pink`, "orange");
    if (!color) return;

    const id = 'custom_' + Date.now();
    customCategories.push({ id, name, keywords, color });
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
    alert(`Супер! Категория "${name}" добавлена.`);
});

// ==========================================
// 4. МИКРОФОН И РАБОТА С ИИ (ProxyAPI)
// ==========================================

const API_KEY = 'sk-bvD4Jpoj4dCgqM515qFm2wDH7WNbmQgm'; 

const micBtn = document.getElementById('mic-btn');
const taskInput = document.getElementById('task-input');
const sendBtn = document.getElementById('send-btn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    
    // ВЫКЛЮЧАЕМ ГЛЮЧНЫЕ НАСТРОЙКИ ANDROID
    recognition.continuous = false; 
    recognition.interimResults = false; 

    let isRecording = false; 
    let stopTimeout; 

    // === ЛОГИКА "РАЦИИ" ===
    const startRecording = (e) => {
        e.preventDefault(); 
        clearTimeout(stopTimeout); 
        if (isRecording) return;
        taskInput.value = '';
        try { recognition.start(); } catch(err) {} 
    };

    const stopRecording = (e) => {
        e.preventDefault();
        if (!isRecording) return;
        // Даем браузеру полсекунды дослушать последнее слово
        stopTimeout = setTimeout(() => {
            recognition.stop();
        }, 500);
    };

    // События для мышки
    micBtn.addEventListener('mousedown', startRecording);
    micBtn.addEventListener('mouseup', stopRecording);
    micBtn.addEventListener('mouseleave', stopRecording); 

    // События для телефона
    micBtn.addEventListener('touchstart', startRecording, {passive: false});
    micBtn.addEventListener('touchend', stopRecording);
    micBtn.addEventListener('touchcancel', stopRecording);

    recognition.onstart = () => {
        isRecording = true;
        micBtn.style.color = '#10b981'; 
        taskInput.placeholder = 'Слушаю... (отпустите кнопку в конце)';
    };

    // ИДЕАЛЬНЫЙ СБОРЩИК: Берем только 1 финальный результат!
    recognition.onresult = (e) => {
        taskInput.value = e.results[0][0].transcript;
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.style.color = '#ef4444'; 
        taskInput.placeholder = 'Напиши задачу...';
    };
    
    recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'network') {
            console.error("Ошибка микрофона:", e.error);
        }
        isRecording = false;
        micBtn.style.color = '#ef4444';
        taskInput.placeholder = 'Напиши задачу...';
    };
}

async function sendToAI(userText) {
    const originalText = taskInput.value;
    taskInput.value = 'ИИ анализирует...';
    
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    
    const dToday = new Date(today - offset);
    const strToday = dToday.toISOString().split('T')[0];
    
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const currentDayName = daysOfWeek[today.getDay()];

    // === ПАМЯТЬ ИИ (СЕГОДНЯ + 21 ДЕНЬ ВПЕРЕД) ===
    const targetDates = [];
    for(let i = 0; i <= 21; i++) {
        let d = new Date(dToday);
        d.setDate(d.getDate() + i);
        targetDates.push(d.toISOString().split('T')[0]);
    }
    const contextTasks = plannerTasks
        .filter(t => targetDates.includes(t.date) && !t.isDone)
        .map(t => `ID: "${t.id}" | Дата: ${t.date} | Время: ${t.startHour}:${t.startMinute?.toString().padStart(2, '0')} | Длит: ${t.durationMinutes} мин | Название: "${t.title}"`)
        .join('\n    ');

    let dynamicCategoriesText = customCategories.map(c => `- "${c.id}" (${c.name}): ${c.keywords}`).join('\n    ');

    const prompt = `
    Ты — ИИ-ассистент. Твоя задача ТОЛЬКО извлекать параметры.
    Сегодня: ${strToday} (День недели: ${currentDayName}).

    Твоя память на ближайшие 3 недели (текущие задачи):
    ${contextTasks || "Нет активных задач."}

    ПРАВИЛА:
    1.  **ДНИ НЕДЕЛИ:** Если просят "во вторник", верни "targetDayOfWeek": 2 (0-Вс, 1-Пн, 2-Вт, 3-Ср, 4-Чт, 5-Пт, 6-Сб). Дату "date" при этом НЕ меняй. Если день не назван, верни null.
    2.  **Повторения:** "каждый вторник 2 недели" -> targetDayOfWeek: 2, repeat_frequency: "weekly", repeat_count: 2.
    3.  **Время:** "с 12 до 13" -> startHour: 12, endHour: 13.
    4.  **МАССОВОЕ ОБНОВЛЕНИЕ (КРИТИЧЕСКИ ВАЖНО):** Если просят перенести регулярную задачу (например, "перенеси врача на 15:00"), найди в своей памяти ВСЕ задачи с этим названием. Верни отдельный объект "update" для КАЖДОГО их ID! (То есть, если в памяти 3 врача, верни массив из 3-х объектов).
    5.  **UPDATE:** Что не меняется — ставь null.
    6.  **Формат:** ТОЛЬКО массив JSON.

    Шаблон JSON ответа:
    [
      {
        "action": "create", 
        "id": null,
        "title": "Новая задача",
        "date": "${strToday}",
        "targetDayOfWeek": null,
        "startHour": 10,
        "startMinute": 0,
        "endHour": null,
        "endMinute": null,
        "durationMinutes": 60,
        "category": "personal",
        "priority": "low",
        "repeat_frequency": null,
        "repeat_count": null
      }
    ]
    `;

    try {
        const response = await fetch('https://api.proxyapi.ru/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}` 
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', 
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: userText }
                ],
                temperature: 0.1
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Ошибка от сервера:', data.error);
            alert('Ошибка сервера: ' + data.error.message);
            taskInput.value = originalText;
            return;
        }

        let rawJson = data.choices[0].message.content;
        const jsonMatch = rawJson.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            alert('ИИ не понял запрос.');
            taskInput.value = originalText;
            return;
        }
        
        const tasksArray = JSON.parse(jsonMatch[0]);

        // === ЖЕЛЕЗОБЕТОННАЯ МАТЕМАТИКА ДНЕЙ НЕДЕЛИ ===
        tasksArray.forEach(task => {
            if (task.targetDayOfWeek !== null && task.targetDayOfWeek !== undefined) {
                let baseDate = new Date(strToday + 'T00:00:00'); 
                let currentDay = baseDate.getDay(); 
                let target = task.targetDayOfWeek;
                
                // Вычисляем, сколько дней нужно прибавить до нужного дня недели
                let diff = target - currentDay;
                if (diff < 0) diff += 7; // Если сегодня Ср(3), а просят Вт(2), прибавляем неделю
                
                baseDate.setDate(baseDate.getDate() + diff);
                const localOffset = baseDate.getTimezoneOffset() * 60000;
                task.date = new Date(baseDate - localOffset).toISOString().split('T')[0];
            }
        });

        // === ГЕНЕРАТОР ПОВТОРЕНИЙ ===
        const finalTasksToProcess = [];
        tasksArray.forEach(taskRule => {
            if (taskRule.action === 'create' && taskRule.repeat_frequency && taskRule.repeat_count > 1) {
                const startDate = new Date(taskRule.date + 'T00:00:00');
                for (let i = 0; i < taskRule.repeat_count; i++) {
                    const newTask = { ...taskRule };
                    const nextDate = new Date(startDate);
                    if (taskRule.repeat_frequency === 'weekly') {
                        nextDate.setDate(startDate.getDate() + (i * 7));
                    } else if (taskRule.repeat_frequency === 'daily') {
                        nextDate.setDate(startDate.getDate() + i);
                    }
                    const localOffset = nextDate.getTimezoneOffset() * 60000;
                    newTask.date = new Date(nextDate - localOffset).toISOString().split('T')[0];
                    finalTasksToProcess.push(newTask);
                }
            } else {
                finalTasksToProcess.push(taskRule);
            }
        });

        // === ОБРАБОТКА (UPDATE, DELETE, CREATE) ===
        finalTasksToProcess.forEach(taskParams => {
            if (taskParams.action !== 'delete' && taskParams.endHour !== null && taskParams.endHour !== undefined) {
                const taskToUpdate = plannerTasks.find(t => t.id === taskParams.id);
                const startHour = taskParams.startHour !== null ? taskParams.startHour : (taskToUpdate?.startHour || 0);
                const startMinute = taskParams.startMinute !== null ? taskParams.startMinute : (taskToUpdate?.startMinute || 0);
                const startTotal = startHour * 60 + startMinute;
                let endTotal = taskParams.endHour * 60 + (taskParams.endMinute || 0);
                if (endTotal < startTotal) endTotal += 24 * 60; // Переход через полночь
                taskParams.durationMinutes = endTotal - startTotal;
            }

            if (taskParams.action === 'delete') {
                plannerTasks = plannerTasks.filter(t => t.id !== taskParams.id);
            } else if (taskParams.action === 'update') {
                const index = plannerTasks.findIndex(t => t.id === taskParams.id);
                if (index !== -1) {
                    const oldTask = plannerTasks[index];
                    plannerTasks[index] = { ...oldTask, ...Object.fromEntries(Object.entries(taskParams).filter(([_, v]) => v !== null)) };
                } else { 
                    taskParams.id = 't_' + Date.now() + Math.random();
                    taskParams.isDone = false;
                    taskParams.durationMinutes = taskParams.durationMinutes || 60;
                    plannerTasks.push(taskParams);
                }
            } else { // Create
                taskParams.id = 't_' + Date.now() + Math.random();
                taskParams.isDone = false;
                taskParams.durationMinutes = taskParams.durationMinutes || 60;
                taskParams.category = taskParams.category || 'personal'; // Защита от прозрачности
                plannerTasks.push(taskParams);
            }
        });
        
        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
        renderAllTasks();
        
        taskInput.value = ''; 
        taskInput.placeholder = `Создано задач: ${finalTasksToProcess.length}`;
        setTimeout(() => taskInput.placeholder = 'Напиши задачу...', 2500);

    } catch (error) {
        console.error('Сбой приложения:', error);
        taskInput.value = originalText;
        alert('Не удалось обработать задачу. Открой консоль (F12) для деталей.');
    }
}
sendBtn.addEventListener('click', () => {
    if (taskInput.value.trim() !== '') sendToAI(taskInput.value);
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && taskInput.value.trim() !== '') sendToAI(taskInput.value);
});
// ==========================================
// 5. ТЕМНАЯ ТЕМА
// ==========================================
const themeBtn = document.getElementById('theme-btn');

// БЕЗОПАСНАЯ ПРОВЕРКА: Если кнопка темы найдена, то работаем с ней
if (themeBtn) {
    const themeIcon = themeBtn.querySelector('i');

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark'); 
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}
// ==========================================
// 6. РУЧНОЕ РЕДАКТИРОВАНИЕ ЗАДАЧ
// ==========================================
const editModal = document.getElementById('edit-modal');
const inTitle = document.getElementById('edit-title');
const inDate = document.getElementById('edit-date');
const inTime = document.getElementById('edit-time');
const inDuration = document.getElementById('edit-duration');
const inPriority = document.getElementById('edit-priority');

const btnSaveEdit = document.getElementById('btn-save-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnDeleteTask = document.getElementById('btn-delete-task');

let editingTaskIndex = -1; // Индекс задачи, которую сейчас редактируем

function openTaskModal(task, index) {
    editingTaskIndex = index;
    
    // Заполняем поля старыми данными
    inTitle.value = task.title;
    inDate.value = task.date;
    inTime.value = `${task.startHour.toString().padStart(2, '0')}:${task.startMinute.toString().padStart(2, '0')}`;
    inDuration.value = task.durationMinutes;
    inPriority.value = task.priority || 'low';
    
    editModal.style.display = 'flex'; // Показываем окно
}

// Кнопка Отмена
btnCancelEdit.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Кнопка Сохранить
btnSaveEdit.addEventListener('click', () => {
    if (editingTaskIndex === -1) return;
    
    const task = plannerTasks[editingTaskIndex];
    task.title = inTitle.value;
    task.date = inDate.value;
    task.durationMinutes = parseInt(inDuration.value) || 60;
    task.priority = inPriority.value;
    
    // Разбиваем время "14:30" обратно на часы и минуты
    const [h, m] = inTime.value.split(':');
    task.startHour = parseInt(h);
    task.startMinute = parseInt(m);
    
    localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
    renderAllTasks();
    editModal.style.display = 'none';
});

// Кнопка Удалить
btnDeleteTask.addEventListener('click', () => {
    if (confirm(`Точно удалить задачу "${inTitle.value}"?`)) {
        plannerTasks.splice(editingTaskIndex, 1);
        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
        renderAllTasks();
        editModal.style.display = 'none';
    }
});
// ==========================================
// 7. РЕГИСТРАЦИЯ SERVICE WORKER (ДЛЯ PWA)
// ==========================================
// Запускаем Service Worker только на настоящем сайте, а не на локальных файлах
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW зарегистрирован: ', registration);
        
        // Эта часть принудительно активирует новый Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
               // Можно показать пользователю кнопку "Обновить", но мы просто обновим сами
               console.log('Доступно обновление, перезагружаем страницу...');
               window.location.reload(); 
            }
          });
        });

      })
      .catch(err => {
        console.log('Ошибка регистрации SW: ', err);
      });
  });
}