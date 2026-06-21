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
let currentCategoryFilter = 'all'; // Фильтр по умолчанию (показывает всё) 

let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let plannerTasks = JSON.parse(localStorage.getItem('plannerTasks')) || [];

plannerTasks.forEach(task => {
    if (!task.id) task.id = 't_' + Math.random().toString(36).substr(2, 9);
});
localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));

const btnDay = document.getElementById('view-day');
const btnWeek = document.getElementById('view-week');
const btnMonth = document.getElementById('view-month');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dateLabel = document.getElementById('current-date-label');

function updateViewMode(mode, activeBtn) {
    currentView = mode;
    if (btnDay && btnWeek && btnMonth) {
        [btnDay, btnWeek, btnMonth].forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    const daysHeader = document.querySelector('.days-header');
    const anytimeContainer = document.getElementById('anytime-container');
    
    if (currentView === 'month') {
        if (timeGridContainer) timeGridContainer.style.display = 'none';
        if (daysHeader) daysHeader.style.display = 'none';
        if (anytimeContainer) anytimeContainer.style.display = 'none';
        if (monthGrid) monthGrid.style.display = 'grid';
    } else {
        if (timeGridContainer) timeGridContainer.style.display = 'block';
        if (daysHeader) daysHeader.style.display = 'flex';
        if (anytimeContainer) anytimeContainer.style.display = 'flex';
        if (monthGrid) monthGrid.style.display = 'none';
    }

    if (currentView === 'week') {
        if (daysHeader) daysHeader.style.minWidth = '750px';
        if (timeGridContainer) timeGridContainer.style.minWidth = '750px';
        if (anytimeContainer) anytimeContainer.style.minWidth = '750px';
        // Возвращаем сетку на 7 колонок
        const anytimeGrid = document.getElementById('anytime-grid');
        if (anytimeGrid) anytimeGrid.classList.remove('day-mode-grid');
    } else {
        if (daysHeader) daysHeader.style.minWidth = '100%';
        if (timeGridContainer) timeGridContainer.style.minWidth = '100%';
        if (anytimeContainer) anytimeContainer.style.minWidth = '100%';
        
        // Включаем 1 широкую колонку, если это режим "День"
        const anytimeGrid = document.getElementById('anytime-grid');
        if (anytimeGrid && currentView === 'day') {
            anytimeGrid.classList.add('day-mode-grid');
        }
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

if (btnDay) btnDay.addEventListener('click', () => updateViewMode('day', btnDay));
if (btnWeek) btnWeek.addEventListener('click', () => updateViewMode('week', btnWeek));
if (btnMonth) btnMonth.addEventListener('click', () => updateViewMode('month', btnMonth));

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function updateDateLabel() {
    if (!dateLabel) return;
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
    if (currentView === 'month') renderMonthGrid(); else renderGrid();
    renderAllTasks();
}

if (prevBtn) prevBtn.addEventListener('click', () => changeDate(-1));
if (nextBtn) nextBtn.addEventListener('click', () => changeDate(1));

// ==========================================
// 2. ОТРИСОВКА ШАПКИ, СЕТКИ И ЗАДАЧ
// ==========================================
function renderHeader() {
    const headerContainer = document.querySelector('.days-header');
    if (!headerContainer) return;
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
            if (nextDay.toDateString() === today.toDateString()) dayDiv.classList.add('current-day');
            dayDiv.textContent = `${daysOfWeek[nextDay.getDay()]}, ${nextDay.getDate()}`;
            headerContainer.appendChild(dayDiv);
        }
    }
}

function renderGrid() {
    if (!timeGrid) return;
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

function renderMonthGrid() {
    if (!monthGrid) return;
    monthGrid.innerHTML = '';
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const weekDaysOnly = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekDaysOnly.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'month-header-cell';
        headerCell.textContent = day;
        monthGrid.appendChild(headerCell);
    });    

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'month-cell';
        emptyCell.style.backgroundColor = '#f9fafb';
        monthGrid.appendChild(emptyCell);
    }
    
    const todayStr = (new Date(new Date() - new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const cell = document.createElement('div');
        cell.className = 'month-cell';
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cell.dataset.date = dateStr;
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'month-cell-date';
        dateLabel.textContent = d;
        
        if (dateStr === todayStr) {
            dateLabel.style.color = '#3b82f6';
            dateLabel.style.fontWeight = '900';
            cell.style.backgroundColor = '#eff6ff'; 
        }
        
        cell.appendChild(dateLabel);
        monthGrid.appendChild(cell);
    }
}

function renderAllTasks() {
    document.querySelectorAll('.task-card, .month-task').forEach(el => el.remove());

    const anytimeGrid = document.getElementById('anytime-grid');
    if (anytimeGrid) anytimeGrid.innerHTML = ''; 
    let anytimeCounts = [0, 0, 0, 0, 0, 0, 0]; 

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
        // === МАГИЯ ФИЛЬТРА: Если категория не совпадает с фильтром (и фильтр не 'all'), просто игнорируем задачу! ===
        if (currentCategoryFilter !== 'all' && task.category !== currentCategoryFilter) return;

        let segments = [];
        
        // Если есть время (startHour не null)
        if (task.startHour !== null && task.startHour !== undefined) {
            const startMins = task.startHour * 60 + task.startMinute;
            const endMins = startMins + task.durationMinutes;

            if (endMins <= 1440) { 
                segments.push({ date: task.date, startMins: startMins, duration: task.durationMinutes, isContinuation: false });
            } else {
                const part1Duration = 1440 - startMins; 
                const part2Duration = endMins - 1440;   
                const [y, m, d] = task.date.split('-');
                const nextDateObj = new Date(y, m - 1, parseInt(d) + 1);
                const ndOffset = nextDateObj.getTimezoneOffset() * 60000;
                const nextDateStr = (new Date(nextDateObj - ndOffset)).toISOString().split('T')[0];

                segments.push({ date: task.date, startMins: startMins, duration: part1Duration, isContinuation: false });
                segments.push({ date: nextDateStr, startMins: 0, duration: part2Duration, isContinuation: true });
            }
        } else {
            segments.push({ date: task.date, startMins: null, duration: null, isContinuation: false });
        }

        segments.forEach(seg => {
            const isCustom = customCategories.find(c => c.id === task.category);
            
            let categoryName = 'Личное';
            let bgColor = '#8b5cf6';
            if (isCustom) { categoryName = isCustom.name; bgColor = isCustom.color; }
            else if (task.category === 'study') { categoryName = 'Учеба'; bgColor = '#f59e0b'; }
            else if (task.category === 'work') { categoryName = 'Работа'; bgColor = '#10b981'; }
            else if (task.category === 'sport') { categoryName = 'Спорт'; bgColor = '#ef4444'; }
            else if (task.category === 'selfdev') { categoryName = 'Саморазвитие'; bgColor = '#06b6d4'; }
            else if (task.category === 'health') { categoryName = 'Здоровье'; bgColor = '#ec4899'; }
            
            let priorityHtml = '';
            if (task.priority === 'high') priorityHtml = '<span class="priority-high">!!!</span>';
            else if (task.priority === 'medium') priorityHtml = '<span class="priority-med">!</span>';

            if (currentView === 'month') {
                const targetCell = document.querySelector(`.month-cell[data-date="${seg.date}"]`);
                if (targetCell) {
                    const monthTaskEl = document.createElement('div');
                    monthTaskEl.className = `month-task ${task.isDone ? 'done' : ''} ${task.priority === 'high' ? 'priority-high-card' : ''}`;
                    monthTaskEl.style.backgroundColor = bgColor;
                    
                    const timeString = task.startHour !== null ? `${(task.startHour || 0).toString().padStart(2, '0')}:${(task.startMinute || 0).toString().padStart(2, '0')} ` : '';
                    const titleText = seg.isContinuation ? task.title + ' (продолж.)' : timeString + task.title;
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

            let isVisible = false;
            let displayColumnIndex = 0;

            if (currentView === 'day') {
                if (seg.date === selectedDateStr) { isVisible = true; displayColumnIndex = 0; }
            } else if (currentView === 'week') {
                const dayIndexInWeek = weekDates.indexOf(seg.date);
                if (dayIndexInWeek !== -1) { isVisible = true; displayColumnIndex = dayIndexInWeek; }
            }

            if (!isVisible) return; 

            const taskEl = document.createElement('div');
            taskEl.className = `task-card ${isCustom ? '' : 'cat-'+task.category} ${task.priority === 'high' ? 'priority-high-card' : ''}`;
            if (isCustom) taskEl.style.backgroundColor = isCustom.color;
            if (task.isDone) taskEl.classList.add('done');
            
            const titleText = seg.isContinuation ? `${task.title} (продолж.)` : task.title;

            if (task.startHour === null || task.startHour === undefined) {
                taskEl.classList.add('anytime-task');
                taskEl.style.position = 'relative';
                taskEl.style.top = 'auto';
                taskEl.style.left = 'auto';
                taskEl.style.width = '100%';
                taskEl.style.marginBottom = '4px';
                taskEl.style.setProperty('--col', displayColumnIndex); 
                
                anytimeCounts[displayColumnIndex]++;
                
                taskEl.innerHTML = `
                    <div style="display: flex; align-items: center; width: 100%;">
                        <input type="checkbox" class="task-checkbox" ${task.isDone ? 'checked' : ''}>
                        <div class="task-title" style="font-weight: 500;">${priorityHtml} ${titleText}</div>
                    </div>
                `;
                
                const checkbox = taskEl.querySelector('.task-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('click', (e) => {
                        e.stopPropagation(); task.isDone = checkbox.checked; 
                        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks)); renderAllTasks(); 
                    });
                }
                taskEl.addEventListener('click', (e) => {
                    if (e.target.classList.contains('task-checkbox')) return; openTaskModal(task, index);
                });

                if (anytimeGrid) anytimeGrid.appendChild(taskEl);

            } else {
                // === СТАРАЯ ЛОГИКА ДЛЯ ЗАДАЧ С ЧАСАМИ ===
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
                
                const timeStringForDay = `${(task.startHour || 0).toString().padStart(2, '0')}:${(task.startMinute || 0).toString().padStart(2, '0')} `;
                const timeText = seg.isContinuation ? `00:00 (${seg.duration} мин)` : timeStringForDay + `(${task.durationMinutes} мин)`;

                // === УМНАЯ ОТРИСОВКА В ЗАВИСИМОСТИ ОТ ДЛИТЕЛЬНОСТИ ===
                // Если задача 50 минут и меньше — делаем её компактной (в одну строчку)
                if (seg.duration <= 50) {
                    taskEl.classList.add('short-task');
                    taskEl.innerHTML = `
                        <input type="checkbox" class="task-checkbox" ${task.isDone ? 'checked' : ''}>
                        <div class="task-title" style="font-weight: 500;">${priorityHtml} ${titleText}</div>
                    `;
                } else {
                    // Обычная 3-х строчная карточка для длинных задач
                    taskEl.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span class="task-category-label" style="font-size: 10px; opacity: 0.8; font-weight: bold;">[${categoryName}]</span>
                            <input type="checkbox" class="task-checkbox" ${task.isDone ? 'checked' : ''}>
                        </div>
                        <div class="task-title" style="font-weight: 500;">${priorityHtml} ${titleText}</div>
                        <div class="task-time" style="font-size: 11px;">${timeText}</div>
                    `;
                }
                
                const checkbox = taskEl.querySelector('.task-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('click', (e) => {
                        e.stopPropagation(); task.isDone = checkbox.checked; 
                        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks)); renderAllTasks(); 
                    });
                }
                taskEl.addEventListener('click', (e) => {
                    if (e.target.classList.contains('task-checkbox')) return; openTaskModal(task, index);
                });

                if (timeGrid) timeGrid.appendChild(taskEl);
            }
        });
    });
}

updateDateLabel(); 
renderHeader();
renderGrid();
renderAllTasks();

// ==========================================
// 3. ДОБАВЛЕНИЕ НОВЫХ ТЕМ (ШЕСТЕРЕНКА)
// ==========================================
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        const name = prompt("Название новой темы:");
        if (!name) return;
        const keywords = prompt(`Слова-триггеры для темы "${name}" через запятую:`);
        if (!keywords) return;
        const color = prompt(`Цвет карточки (на английском или HEX):`, "orange");
        if (!color) return;

        const id = 'custom_' + Date.now();
        customCategories.push({ id, name, keywords, color });
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        alert(`Супер! Категория "${name}" добавлена.`);
    });
}

// ==========================================
// 4. МИКРОФОН И ИИ 
// ==========================================
const API_KEY = 'sk-bvD4Jpoj4dCgqM515qFm2wDH7WNbmQgm'; 
const micBtn = document.getElementById('mic-btn');
const taskInput = document.getElementById('task-input');
const sendBtn = document.getElementById('send-btn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false; 
    recognition.interimResults = false; 

    let isRecording = false; 
    let stopTimeout; 

    const startRecording = (e) => {
        e.preventDefault(); 
        clearTimeout(stopTimeout); 
        if (isRecording) return;
        if (taskInput) taskInput.value = '';
        try { recognition.start(); } catch(err) {} 
    };

    const stopRecording = (e) => {
        e.preventDefault();
        if (!isRecording) return;
        stopTimeout = setTimeout(() => {
            recognition.stop();
        }, 500);
    };

    if (micBtn) {
        micBtn.addEventListener('mousedown', startRecording);
        micBtn.addEventListener('mouseup', stopRecording);
        micBtn.addEventListener('mouseleave', stopRecording); 
        micBtn.addEventListener('touchstart', startRecording, {passive: false});
        micBtn.addEventListener('touchend', stopRecording);
        micBtn.addEventListener('touchcancel', stopRecording);
    }

    recognition.onstart = () => {
        isRecording = true;
        if (micBtn) micBtn.style.color = '#10b981'; 
        if (taskInput) taskInput.placeholder = 'Слушаю... (отпустите кнопку)';
    };

    recognition.onresult = (e) => {
        if (taskInput) taskInput.value = e.results[0][0].transcript;
    };

    recognition.onend = () => {
        isRecording = false;
        if (micBtn) micBtn.style.color = '#ef4444'; 
        if (taskInput) taskInput.placeholder = 'Напиши задачу...';
    };
    
    recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'network') console.error("Ошибка микрофона:", e.error);
        isRecording = false;
        if (micBtn) micBtn.style.color = '#ef4444';
        if (taskInput) taskInput.placeholder = 'Напиши задачу...';
    };
}

async function sendToAI(userText) {
    if (!taskInput) return;
    const originalText = taskInput.value;
    taskInput.value = 'ИИ анализирует...';
    
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const dToday = new Date(today - offset);
    
    // Считаем завтра и послезавтра для шпаргалки ИИ
    const dTomorrow = new Date(dToday.getTime() + 86400000);
    const dDayAfter = new Date(dToday.getTime() + 86400000 * 2);
    
    const strToday = dToday.toISOString().split('T')[0];
    const strTomorrow = dTomorrow.toISOString().split('T')[0];
    const strDayAfter = dDayAfter.toISOString().split('T')[0];
    
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const currentDayName = daysOfWeek[today.getDay()];

    // Собираем даты на 3 недели вперед
    const targetDates = [];
    for(let i = 0; i <= 21; i++) {
        let d = new Date(dToday);
        d.setDate(d.getDate() + i);
        targetDates.push(d.toISOString().split('T')[0]);
    }

    const contextTasks = plannerTasks
        .filter(t => targetDates.includes(t.date) && !t.isDone)
        .map(t => `ID: "${t.id}" | Дата: ${t.date} | Время: ${t.startHour !== null ? t.startHour : ''}:${t.startMinute !== null ? t.startMinute.toString().padStart(2, '0') : ''} | Длит: ${t.durationMinutes || 0} мин | Название: "${t.title}"`)
        .join('\n    ');

    let dynamicCategoriesText = customCategories.map(c => `- "${c.id}" (${c.name}): ${c.keywords}`).join('\n    ');

    const prompt = `
    Ты — ИИ-ассистент. Твоя задача ТОЛЬКО извлекать параметры.
    Сегодня: ${strToday} (День недели: ${currentDayName}).

    Твоя память (текущие задачи):
    ${contextTasks || "Нет активных задач."}

    КАТЕГОРИИ (category) - ВЫБИРАЙ ИЗ ЭТИХ СТРОГО:
    - "study" (Учеба)
    - "work" (Работа)
    - "personal" (Личное)
    - "sport" (Спорт): качалка зал, волейбол, баскет, валик, бассейн, тренажеры, поло, ФОК, тренер, сушка, фитнес, тренировка, треня, качаться, разминка, зарядка, растяжка.
    - "selfdev" (Саморазвитие): Книга, аудиокнига, курс, вебинар, урок, подкаст, английский, немецкий, медитация, рефлексия, психолог, терапия, коуч, цели, трекер, навык, скилл, вокал, гитара, рисование.
    - "health" (Здоровье): Врач, доктор, стоматолог, терапевт, анализы, узи, мрт, поликлиника, больница, аптека, таблетки, витамины, рецепт, массаж, сон, чекап, зрение, спина, зубы, диета.
    ${dynamicCategoriesText}

    СЛОВАРЬ ВРЕМЕНИ (Для поиска окон):
    - "утром": startHour: 6, maxEndHour: 12
    - "до обеда": startHour: 8, maxEndHour: 12
    - "после обеда": startHour: 12, maxEndHour: 18
    - "днем": startHour: 12, maxEndHour: 18
    - "в первой половине дня": startHour: 9, maxEndHour: 15
    - "во второй половине дня": startHour: 15, maxEndHour: 24
    - "вечером": startHour: 18, maxEndHour: 24
    - "ночью": startHour: 0, maxEndHour: 6

    ПРАВИЛА:
    1. ДНИ НЕДЕЛИ: Если просят "во вторник", верни "targetDayOfWeek": 2. Дату "date" при этом НЕ меняй. 
    2. Повторения: "каждый вторник 2 недели" -> targetDayOfWeek: 2, repeat_frequency: "weekly", repeat_count: 2.
    3. МАССОВОЕ ОБНОВЛЕНИЕ: Перенос регулярной задачи -> верни "update" для КАЖДОГО её ID.
    4. УМНЫЙ ПОИСК ВРЕМЕНИ (AUTO-SCHEDULING): Если просят "найти время", "окно" или говорят слова из СЛОВАРЯ выше ("после обеда" и т.д.) -> action: "auto_schedule". Укажи "durationMinutes". Укажи "startHour" и "maxEndHour" строго из СЛОВАРЯ.
    5. ТОЧНОЕ ВРЕМЯ: "в 15:00" -> action: "create", startHour: 15, maxEndHour: null.
    6. UPDATE: Что не меняется — ставь null.
    7. Формат: ТОЛЬКО массив JSON.

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
        "maxEndHour": null,
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }, { role: 'user', content: userText }], temperature: 0.1 })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let rawJson = data.choices[0].message.content;
        const jsonMatch = rawJson.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("ИИ не понял запрос.");
        
        const tasksArray = JSON.parse(jsonMatch[0]);

        // === ДНИ НЕДЕЛИ ===
        tasksArray.forEach(task => {
            // ЗАПУСКАЕМ ВЫЧИСЛЕНИЕ ТОЛЬКО ЕСЛИ ИИ НЕ ПОСТАВИЛ ДАТУ "ЗАВТРА" ИЛИ "ПОСЛЕЗАВТРА"
            if (task.targetDayOfWeek !== null && task.targetDayOfWeek !== undefined && task.date === strToday) {
                let baseDate = new Date(strToday + 'T00:00:00');
                let currentDay = baseDate.getDay(); 
                let target = task.targetDayOfWeek;
                let diff = target - currentDay;
                if (diff < 0) diff += 7; 
                baseDate.setDate(baseDate.getDate() + diff);
                const localOffset = baseDate.getTimezoneOffset() * 60000;
                task.date = new Date(baseDate - localOffset).toISOString().split('T')[0];
            }
        });

        // === ПОВТОРЕНИЯ ===
        const finalTasksToProcess = [];
        tasksArray.forEach(taskRule => {
            if (taskRule.action === 'create' && taskRule.repeat_frequency && taskRule.repeat_count > 1) {
                const startDate = new Date(taskRule.date + 'T00:00:00');
                for (let i = 0; i < taskRule.repeat_count; i++) {
                    const newTask = { ...taskRule };
                    const nextDate = new Date(startDate);
                    if (taskRule.repeat_frequency === 'weekly') nextDate.setDate(startDate.getDate() + (i * 7));
                    else if (taskRule.repeat_frequency === 'daily') nextDate.setDate(startDate.getDate() + i);
                    const localOffset = nextDate.getTimezoneOffset() * 60000;
                    newTask.date = new Date(nextDate - localOffset).toISOString().split('T')[0];
                    finalTasksToProcess.push(newTask);
                }
            } else {
                finalTasksToProcess.push(taskRule);
            }
        });

        // === ОБРАБОТКА И АВТО-РАСПИСАНИЕ ===
        finalTasksToProcess.forEach(taskParams => {
            // Если ИИ просит нас найти окно
            if (taskParams.action === 'auto_schedule') {
                const dur = taskParams.durationMinutes || 60;
                
                // Берем границы поиска от ИИ (или ставим безопасные 09:00 - 22:00 по умолчанию)
                const searchStartMin = taskParams.startHour !== null ? (taskParams.startHour * 60 + (taskParams.startMinute || 0)) : 9 * 60;
                const searchMaxEndMin = taskParams.maxEndHour !== null ? taskParams.maxEndHour * 60 : 22 * 60; 
                
                // Получаем все задачи на этот день
                let dayTasks = plannerTasks.filter(t => t.date === taskParams.date && t.startHour !== null);
                // Делаем из них массив "занятых отрезков"
                let busy = dayTasks.map(t => ({
                    start: t.startHour * 60 + t.startMinute,
                    end: t.startHour * 60 + t.startMinute + (t.durationMinutes || 60)
                })).sort((a,b) => a.start - b.start);

                let foundStart = null;
                
                // Ищем дырку нужного размера МЕЖДУ ЗАДАННЫМИ ГРАНИЦАМИ
                for (let i = 0; i <= busy.length; i++) {
                    let slotStart = i === 0 ? searchStartMin : Math.max(searchStartMin, busy[i-1].end);
                    let slotEnd = i === busy.length ? searchMaxEndMin : Math.min(searchMaxEndMin, busy[i].start);

                    // Проверяем: влезает ли длительность задачи в это окно
                    if (slotEnd - slotStart >= dur) {
                        foundStart = slotStart;
                        break;
                    }
                }

                if (foundStart !== null) {
                    taskParams.action = 'create'; 
                    taskParams.startHour = Math.floor(foundStart / 60);
                    taskParams.startMinute = foundStart % 60;
                } else {
                    // Если окно не найдено в нужных границах
                    let timeText = taskParams.maxEndHour ? `в период с ${Math.floor(searchStartMin/60)}:00 до ${taskParams.maxEndHour}:00` : '';
                    alert(`В расписании нет свободного окна на ${dur} мин. ${timeText} для задачи "${taskParams.title}"!`);
                    taskParams.action = 'ignore';
                }
            }

            if (taskParams.action === 'ignore') return;
            
            // ... (Дальше идет старый код: Расчет перехода через полночь и т.д.) ...
            if (taskParams.action !== 'delete' && taskParams.endHour !== null && taskParams.endHour !== undefined) {
                const taskToUpdate = plannerTasks.find(t => t.id === taskParams.id);
                const startHour = taskParams.startHour !== null ? taskParams.startHour : (taskToUpdate?.startHour || 0);
                const startMinute = taskParams.startMinute !== null ? taskParams.startMinute : (taskToUpdate?.startMinute || 0);
                const startTotal = startHour * 60 + startMinute;
                let endTotal = taskParams.endHour * 60 + (taskParams.endMinute || 0);
                if (endTotal < startTotal) endTotal += 24 * 60; 
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
                taskParams.category = taskParams.category || 'personal'; 
                plannerTasks.push(taskParams);
            }
        });
        
        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
        renderAllTasks();
        
        if (taskInput) {
            taskInput.value = ''; 
            taskInput.placeholder = 'Сделано!';
            setTimeout(() => taskInput.placeholder = 'Напиши задачу...', 2500);
        }

    } catch (error) {
        console.error('Сбой:', error);
        if (taskInput) taskInput.value = originalText;
        alert('Сбой: ' + error.message);
    }
}

if (sendBtn) {
    sendBtn.addEventListener('click', () => {
        if (taskInput && taskInput.value.trim() !== '') sendToAI(taskInput.value);
    });
}

if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && taskInput.value.trim() !== '') sendToAI(taskInput.value);
    });
}

// ==========================================
// 5. ТЕМНАЯ ТЕМА
// ==========================================
const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
    const themeIcon = themeBtn.querySelector('i');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark'); 
        } else {
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ==========================================
// 6. РУЧНОЕ ДОБАВЛЕНИЕ И РЕДАКТИРОВАНИЕ ЗАДАЧ
// ==========================================
const editModal = document.getElementById('edit-modal');
const modalTitle = document.getElementById('modal-title');
const inTitle = document.getElementById('edit-title');
const inCategory = document.getElementById('edit-category');
const inDate = document.getElementById('edit-date');
const inTime = document.getElementById('edit-time');
const inDuration = document.getElementById('edit-duration');
const inPriority = document.getElementById('edit-priority');

const btnAdd = document.getElementById('add-btn');
const btnSaveEdit = document.getElementById('btn-save-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnDeleteTask = document.getElementById('btn-delete-task');

let editingTaskIndex = -1; // -1 значит "Создаем новую", всё остальное — "Редактируем старую"

// Функция обновления списка категорий в выпадающем окне
function updateCategorySelect() {
    const inCategory = document.getElementById('edit-category');
    const filterSelect = document.getElementById('category-filter');
    
    let options = `
        <option value="personal">Личное</option>
        <option value="work">Работа</option>
        <option value="study">Учеба</option>
        <option value="sport">Спорт</option>
        <option value="selfdev">Саморазвитие</option>
        <option value="health">Здоровье</option>
    `;
    
    customCategories.forEach(c => {
        options += `<option value="${c.id}">${c.name}</option>`;
    });

    if (inCategory) inCategory.innerHTML = options;
    if (filterSelect) {
        // Для фильтра добавляем пункт "Всё" в самое начало
        filterSelect.innerHTML = `<option value="all">Показывать всё</option>` + options;
        filterSelect.value = currentCategoryFilter; // Сохраняем текущий выбор
    }
}

// Запускаем обновление списков один раз при загрузке страницы:
updateCategorySelect();

// Слушаем, когда пользователь меняет фильтр
const categoryFilterDropdown = document.getElementById('category-filter');
if (categoryFilterDropdown) {
    categoryFilterDropdown.addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value; // Запоминаем, что выбрали
        renderAllTasks(); // Перерисовываем весь календарь!
    });
}

// 1. ОТКРЫТЬ ОКНО ДЛЯ РЕДАКТИРОВАНИЯ СТАРОЙ
function openTaskModal(task, index) {
    editingTaskIndex = index;
    modalTitle.textContent = "Редактировать задачу";
    btnDeleteTask.style.display = 'block'; // Показываем кнопку удаления
    
    updateCategorySelect();
    
    inTitle.value = task.title;
    inCategory.value = task.category || 'personal';
    inDate.value = task.date;
    inTime.value = task.startHour !== null && task.startHour !== undefined ? `${task.startHour.toString().padStart(2, '0')}:${task.startMinute.toString().padStart(2, '0')}` : '';
    inDuration.value = task.durationMinutes || '';
    inPriority.value = task.priority || 'low';
    
    if (editModal) editModal.style.display = 'flex'; 
}

// 2. ОТКРЫТЬ ОКНО ДЛЯ СОЗДАНИЯ НОВОЙ
if (btnAdd) {
    btnAdd.addEventListener('click', () => {
        editingTaskIndex = -1; // Флаг: мы создаем!
        modalTitle.textContent = "Новая задача";
        btnDeleteTask.style.display = 'none'; // Прячем корзину, ведь удалять нечего
        
        updateCategorySelect();
        
        // Очищаем все поля и ставим сегодняшнюю дату
        inTitle.value = '';
        inCategory.value = 'personal';
        
        const offset = selectedDate.getTimezoneOffset() * 60000;
        inDate.value = (new Date(selectedDate - offset)).toISOString().split('T')[0];
        
        inTime.value = '';
        inDuration.value = '60'; // По умолчанию 1 час
        inPriority.value = 'low';
        
        if (editModal) editModal.style.display = 'flex';
    });
}

// Кнопка Отмена
if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => { if (editModal) editModal.style.display = 'none'; });

// Кнопка Сохранить (работает и для сохранения, и для создания!)
if (btnSaveEdit) {
    btnSaveEdit.addEventListener('click', () => {
        if (!inTitle.value.trim()) {
            alert('Название задачи не может быть пустым!');
            return;
        }

        let newTaskData = {
            title: inTitle.value,
            date: inDate.value,
            category: inCategory.value,
            durationMinutes: parseInt(inDuration.value) || null,
            priority: inPriority.value,
            isDone: false
        };
        
        // Парсим время
        if (inTime.value) {
            const [h, m] = inTime.value.split(':');
            newTaskData.startHour = parseInt(h);
            newTaskData.startMinute = parseInt(m);
            newTaskData.durationMinutes = newTaskData.durationMinutes || 60; // Если время есть, а длительности нет - ставим час
        } else {
            newTaskData.startHour = null;
            newTaskData.startMinute = null;
        }

        // Если редактировали — перезаписываем
        if (editingTaskIndex !== -1) {
            newTaskData.id = plannerTasks[editingTaskIndex].id;
            newTaskData.isDone = plannerTasks[editingTaskIndex].isDone;
            plannerTasks[editingTaskIndex] = newTaskData;
        } else {
            // Если создавали — пушим новую в массив
            newTaskData.id = 't_' + Date.now();
            plannerTasks.push(newTaskData);
        }
        
        localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
        renderAllTasks();
        if (editModal) editModal.style.display = 'none';
    });
}

// Кнопка Удалить
if (btnDeleteTask) {
    btnDeleteTask.addEventListener('click', () => {
        const title = inTitle ? inTitle.value : '';
        if (confirm(`Точно удалить задачу "${title}"?`)) {
            plannerTasks.splice(editingTaskIndex, 1);
            localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
            renderAllTasks();
            if (editModal) editModal.style.display = 'none';
        }
    });
}
// ==========================================
// 8. БОКОВОЕ МЕНЮ
// ==========================================
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');
const menuOverlay = document.getElementById('menu-overlay');
const clearDoneBtn = document.getElementById('clear-done-btn');

function toggleMenu() {
    if (!sideMenu) return;
    const isOpen = sideMenu.classList.contains('open');
    if (isOpen) {
        sideMenu.classList.remove('open');
        menuOverlay.style.display = 'none';
    } else {
        sideMenu.classList.add('open');
        menuOverlay.style.display = 'flex';
    }
}

// Открытие / Закрытие
if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu); // Закрываем при клике в пустоту

// Очистка выполненных задач
if (clearDoneBtn) {
    clearDoneBtn.addEventListener('click', () => {
        const doneTasksCount = plannerTasks.filter(t => t.isDone).length;
        if (doneTasksCount === 0) {
            alert('Нет выполненных задач для очистки.');
            return;
        }
        
        if (confirm(`Удалить ${doneTasksCount} выполненных задач?`)) {
            plannerTasks = plannerTasks.filter(t => !t.isDone);
            localStorage.setItem('plannerTasks', JSON.stringify(plannerTasks));
            renderAllTasks();
            toggleMenu(); // Закрываем меню после успеха
        }
    });
}

// ==========================================
// 7. SW
// ==========================================
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
               window.location.reload(); 
            }
          });
        });
      });
  });
}
// ==========================================
// 8. ПРИЛИПАНИЕ ЧАСОВ ПРИ ПРОКРУТКЕ
// ==========================================
const calGrid = document.querySelector('.calendar-grid');
if (calGrid) {
    // Внимательно слушаем, когда ты листаешь экран вправо-влево
    calGrid.addEventListener('scroll', () => {
        const offset = calGrid.scrollLeft;
        
        // Берем все циферблаты часов и сдвигаем их вслед за пальцем
        document.querySelectorAll('.hour-label').forEach(label => {
            // -8px нужны для того, чтобы цифры оставались ровно на своих полосках
            label.style.transform = `translate(${offset}px, -8px)`;
        });
    });
}