// Глобальные переменные
let csvData = [];
let radarChart = null;
let timelineChart = null;

// Маппинг интервалов
const INTERVALS_MAP = {
    'Ч1': ['унисон', 'прим'],
    'М2': ['малая секунд', 'малая 2', 'мал секунд', 'м2'],
    'Б2': ['большая секунд', 'большая 2', 'бол секунд', 'б2'],
    'М3': ['малая терц', 'малая 3', 'мал терц', 'м3'],
    'Б3': ['большая терц', 'большая 3', 'бол терц', 'б3'],
    'Ч4': ['кварт', 'чистая 4', 'чист кварт', 'ч4'],
    'Ч5': ['квинт', 'чистая 5', 'чист квинт', 'ч5'],
    'М6': ['малая секст', 'малая 6', 'мал секст', 'м6'],
    'Б6': ['большая секст', 'большая 6', 'бол секст', 'б6'],
    'М7': ['малая септим', 'малая 7', 'мал септим', 'м7'],
    'Б7': ['большая септим', 'большая 7', 'бол септим', 'б7'],
    'Ч8': ['октав', 'чистая 8', 'чист октав', 'ч8']
};

// Определение интервала из текста
function detectIntervals(text) {
    const lowerText = text.toLowerCase();
    const foundIntervals = [];
    
    for (const [interval, keywords] of Object.entries(INTERVALS_MAP)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                foundIntervals.push(interval);
                break;
            }
        }
    }
    
    return foundIntervals;
}

// Определение направления
function detectDirection(text) {
    const lowerText = text.toLowerCase();
    const directions = [];
    
    if (lowerText.includes('восходящ') || lowerText.includes('восход')) {
        directions.push('ascending');
    }
    if (lowerText.includes('нисходящ') || lowerText.includes('нисход')) {
        directions.push('descending');
    }
    if (lowerText.includes('гармонич')) {
        directions.push('harmonic');
    }
    
    // Если направление не указано, по умолчанию восходящее
    return directions.length > 0 ? directions : ['ascending'];
}

// Парсинг CSV
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index] || '';
            });
            csvData.push(entry);
        }
    }
    
    console.log(`Загружено ${csvData.length} записей`);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Загрузка CSV при старте - отключена, пользователь загружает сам
window.addEventListener('load', () => {
    console.log('Приложение загружено. Загрузите CSV файл вручную.');
    initializeApp();
});

// Загрузка CSV вручную
document.getElementById('csvUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            parseCSV(event.target.result);
            document.getElementById('fileName').textContent = file.name;
            initializeApp();
            // Обновляем расписание если день уже выбран
            if (selectedDate) {
                showScheduleForDate(selectedDate);
            }
        };
        reader.readAsText(file);
    }
});

// Инициализация приложения
function initializeApp() {
    setupExerciseCards();
    checkDataAvailability();
}

// Проверка доступности данных для каждой карточки
function checkDataAvailability() {
    document.querySelectorAll('.exercise-card').forEach(card => {
        const exerciseType = card.dataset.type;
        
        // Фильтруем данные по типу упражнения
        const exerciseData = csvData.filter(entry => {
            const desc = (entry['Description'] || '').toLowerCase();
            const task = (entry['Task'] || '').toLowerCase();
            const type = exerciseType.toLowerCase();
            
            // Более гибкий поиск по ключевым словам
            if (type === 'определение интервалов') {
                return desc.includes('определение интервал') || desc.includes('определение') && desc.includes('интервал');
            }
            if (type === 'сравнение интервалов') {
                return desc.includes('сравнение интервал') || desc.includes('сравнение') && desc.includes('интервал');
            }
            if (type === 'пение интервалов') {
                return desc.includes('пение интервал') || desc.includes('пение') && desc.includes('интервал');
            }
            if (type === 'чтение интервалов') {
                return desc.includes('чтение интервал') || desc.includes('чтение') && desc.includes('интервал');
            }
            if (type === 'абсолютный слух') {
                return desc.includes('абсолютный слух') || task.includes('абсолютный слух');
            }
            if (type === 'пение нот') {
                return desc.includes('пение нот') || desc.includes('пение') && desc.includes('нот');
            }
            if (type === 'чтение нот') {
                return desc.includes('чтение нот') || desc.includes('чтение') && desc.includes('нот');
            }
            if (type === 'clefs') {
                return desc.includes('clefs') || task.includes('clefs') || desc.includes('ключ');
            }
            
            // Общий поиск как fallback
            return desc.includes(type) || task.includes(type);
        });
        
        // Если данных нет, блокируем карточку
        if (exerciseData.length === 0) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

// Настройка карточек упражнений
function setupExerciseCards() {
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.addEventListener('click', () => {
            // Проверяем, не заблокирована ли карточка
            if (card.classList.contains('disabled')) {
                return;
            }
            
            const exerciseType = card.dataset.type;
            showExerciseDetail(exerciseType, card);
        });
    });
}

// Показать детали упражнения
function showExerciseDetail(exerciseType, clickedCard) {
    const contentWrapper = document.getElementById('contentWrapper');
    const detailTitle = document.getElementById('detailTitle');
    
    // Фильтруем данные по типу упражнения с улучшенной логикой
    const exerciseData = csvData.filter(entry => {
        const desc = (entry['Description'] || '').toLowerCase();
        const task = (entry['Task'] || '').toLowerCase();
        const type = exerciseType.toLowerCase();
        
        // Более гибкий поиск по ключевым словам
        if (type === 'определение интервалов') {
            return desc.includes('определение интервал') || desc.includes('определение') && desc.includes('интервал');
        }
        if (type === 'сравнение интервалов') {
            return desc.includes('сравнение интервал') || desc.includes('сравнение') && desc.includes('интервал');
        }
        if (type === 'пение интервалов') {
            return desc.includes('пение интервал') || desc.includes('пение') && desc.includes('интервал');
        }
        if (type === 'чтение интервалов') {
            return desc.includes('чтение интервал') || desc.includes('чтение') && desc.includes('интервал');
        }
        if (type === 'абсолютный слух') {
            return desc.includes('абсолютный слух') || task.includes('абсолютный слух');
        }
        if (type === 'пение нот') {
            return desc.includes('пение нот') || desc.includes('пение') && desc.includes('нот');
        }
        if (type === 'чтение нот') {
            return desc.includes('чтение нот') || desc.includes('чтение') && desc.includes('нот');
        }
        if (type === 'clefs') {
            return desc.includes('clefs') || task.includes('clefs') || desc.includes('ключ');
        }
        
        // Общий поиск как fallback
        return desc.includes(type) || task.includes(type);
    });
    
    if (exerciseData.length === 0) {
        alert('Нет данных для этого упражнения');
        return;
    }
    
    // Активируем режим детального просмотра
    contentWrapper.classList.add('detail-active');
    
    // Убираем активный класс со всех карточек и колонок
    document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.column').forEach(c => c.classList.remove('active-column'));
    
    // Активируем кликнутую карточку
    clickedCard.classList.add('active');
    
    // Активируем колонку, содержащую кликнутую карточку
    const parentColumn = clickedCard.closest('.column');
    if (parentColumn) {
        parentColumn.classList.add('active-column');
    }
    
    // Обновляем заголовок
    detailTitle.textContent = clickedCard.querySelector('h3').textContent;
    
    // Анализируем данные
    analyzeExerciseData(exerciseData);
}

// Анализ данных упражнения
function analyzeExerciseData(exerciseData) {
    const intervalStats = {};
    const intervalCounts = {}; // Добавляем счетчик количества сессий
    const directionStats = {
        ascending: {},
        descending: {},
        harmonic: {}
    };
    
    let totalMinutes = 0;
    let sessionCount = exerciseData.length;
    
    exerciseData.forEach(entry => {
        const desc = entry['Description'] || '';
        const duration = parseFloat(entry['Duration (decimal)'] || 0) * 60; // в минутах
        totalMinutes += duration;
        
        // Определяем интервалы
        const intervals = detectIntervals(desc);
        const directions = detectDirection(desc);
        
        intervals.forEach(interval => {
            // Считаем время (для детализации)
            if (!intervalStats[interval]) {
                intervalStats[interval] = 0;
            }
            intervalStats[interval] += duration;
            
            // Считаем количество сессий (для радарной диаграммы)
            if (!intervalCounts[interval]) {
                intervalCounts[interval] = 0;
            }
            intervalCounts[interval] += 1;
            
            // Распределяем по направлениям
            directions.forEach(direction => {
                if (!directionStats[direction][interval]) {
                    directionStats[direction][interval] = 0;
                }
                directionStats[direction][interval] += duration;
            });
        });
    });
    
    // Обновляем статистику
    document.getElementById('totalTime').textContent = Math.round(totalMinutes) + ' мин';
    document.getElementById('sessionCount').textContent = sessionCount;
    document.getElementById('avgSession').textContent = Math.round(totalMinutes / sessionCount) + ' мин';
    
    // Создаем радарную диаграмму с количеством сессий
    createRadarChart(intervalCounts);
    
    // Показываем детализацию с временем
    showIntervalsBreakdown(intervalStats, directionStats);
    
    // Создаем график истории
    createTimelineChart(exerciseData);
}

// Создание радарной диаграммы
function createRadarChart(intervalCounts) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    if (radarChart) {
        radarChart.destroy();
    }
    
    // Располагаем интервалы так, чтобы обращения были напротив друг друга
    // Правильный порядок для 12 позиций (как часы)
    const correctOrder = ['Ч1', 'М2', 'Б2', 'М3', 'Б3', 'Ч4', 'Ч8', 'Б7', 'М7', 'Б6', 'М6', 'Ч5'];
    const data = correctOrder.map(interval => intervalCounts[interval] || 0);
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: correctOrder,
            datasets: [{
                label: 'Количество сессий',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                borderWidth: 3,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        color: '#aaa',
                        backdropColor: 'transparent',
                        font: { size: 12 },
                        stepSize: 1 // Показываем целые числа для количества сессий
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#eee',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#eee',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Показать детализацию по интервалам
function showIntervalsBreakdown(intervalStats, directionStats) {
    const container = document.getElementById('intervalsBreakdown');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Используем тот же порядок, что и в радарной диаграмме
    const intervalOrder = ['Ч1', 'М2', 'Б2', 'М3', 'Б3', 'Ч4', 'Ч5', 'М6', 'Б6', 'М7', 'Б7', 'Ч8'];
    
    intervalOrder.forEach(interval => {
        const total = intervalStats[interval] || 0;
        if (total > 0) {
            const asc = directionStats.ascending[interval] || 0;
            const desc = directionStats.descending[interval] || 0;
            const harm = directionStats.harmonic[interval] || 0;
            
            const item = document.createElement('div');
            item.className = 'interval-item';
            item.innerHTML = `
                <div class="interval-header">
                    <span class="interval-name">${interval}</span>
                    <span class="interval-time">${Math.round(total)} мин</span>
                </div>
                <div class="interval-directions">
                    ${asc > 0 ? `<span class="dir-badge asc">↗ Восходящие: ${Math.round(asc)} мин</span>` : ''}
                    ${desc > 0 ? `<span class="dir-badge desc">↘ Нисходящие: ${Math.round(desc)} мин</span>` : ''}
                    ${harm > 0 ? `<span class="dir-badge harm">🎵 Гармонические: ${Math.round(harm)} мин</span>` : ''}
                </div>
            `;
            container.appendChild(item);
        }
    });
}

// Создание графика истории
function createTimelineChart(exerciseData) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    // Группируем по датам
    const dateStats = {};
    exerciseData.forEach(entry => {
        const date = entry['Start Date'];
        const duration = parseFloat(entry['Duration (decimal)'] || 0) * 60;
        
        if (!dateStats[date]) {
            dateStats[date] = 0;
        }
        dateStats[date] += duration;
    });
    
    const sortedDates = Object.keys(dateStats).sort();
    const data = sortedDates.map(date => Math.round(dateStats[date]));
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Минуты практики',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#aaa',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#aaa',
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#eee',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Закрытие панели деталей
document.getElementById('closeBtn').addEventListener('click', () => {
    const contentWrapper = document.getElementById('contentWrapper');
    
    contentWrapper.classList.remove('detail-active');
    document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.column').forEach(c => c.classList.remove('active-column'));
});


// Функция для прокрутки к расписанию
function scrollToSchedule() {
    document.getElementById('embeddedSchedule').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Календарь и расписание
let currentDate = new Date();
let selectedDate = null;

// Данные расписаний с упражнениями
const schedules = {
    'monday-friday': {
        title: 'ПОНЕДЕЛЬНИК и ПЯТНИЦА',
        focus: 'Фокус: Пение + Чтение интервалов',
        exercises: ['пение интервалов', 'чтение интервалов', 'clefs'], // 3, 4, 8
        schedule: [
            { time: '0–10 мин', exercise: 'Пение Интервалов', description: 'Только **восходящие** (Do→Fa, Do→Sol и т.д.)' },
            { time: '10–20 мин', exercise: 'Пение Интервалов', description: 'Только **нисходящие** (Fa→Do, Sol→Do и т.д.)' },
            { time: '20–30 мин', exercise: 'Пение Интервалов', description: 'Повторите то направление, которое даётся хуже' },
            { time: '30–40 мин', exercise: 'Чтение Интервалов', description: 'На стане: ч4, ч5 (восходящие, нисходящие)' },
            { time: '40–50 мин', exercise: 'Чтение Интервалов', description: 'То же — фокус на визуальном распознавании' },
            { time: '50–60 мин', exercise: 'Clefs', description: 'Чтение нот C–B (малая октава, без диезов/бемолей)' }
        ]
    },
    'wednesday-sunday': {
        title: 'СРЕДА и ВОСКРЕСЕНЬЕ',
        focus: 'Фокус: Определение + Сравнение интервалов',
        warning: '⚠️ **Гармонические интервалы временно убраны** (до недели 3)',
        exercises: ['определение интервалов', 'сравнение интервалов', 'clefs'], // 1, 2, 8
        schedule: [
            { time: '0–10 мин', exercise: 'Определение Интервалов', description: 'Только **мелодические восходящие** (ч4, ч5 → вы их **слушаете и пропеваете**)' },
            { time: '10–20 мин', exercise: 'Определение Интервалов', description: 'Только **мелодические нисходящие** (Fa→Do, Sol→Do → **слушаете и пропеваете**)' },
            { time: '20–30 мин', exercise: 'Определение Интервалов', description: 'Повтор слабого направления' },
            { time: '30–40 мин', exercise: 'Сравнение Интервалов', description: 'Только **мелодические восходящие** (ч4 vs ч5)' },
            { time: '40–50 мин', exercise: 'Сравнение Интервалов', description: 'Только **мелодические нисходящие** (ч4 vs ч5)' },
            { time: '50–60 мин', exercise: 'Clefs', description: 'Чтение нот C–B' }
        ]
    },
    'other-days': {
        title: 'ВТОРНИК, ЧЕТВЕРГ, СУББОТА',
        focus: 'Фокус: Абсолютный слух + Пение нот + Поддержка интервалов',
        exercises: ['абсолютный слух', 'пение интервалов', 'пение нот', 'clefs'], // 5, 3, 6, 8
        schedule: [
            { time: '0–10 мин', exercise: 'Абсолютный слух', description: 'Только **7 ступеней (C–B)**, **C4–B4**, без диезов/бемолей' },
            { time: '10–20 мин', exercise: 'Абсолютный слух', description: 'То же — случайный порядок' },
            { time: '20–25 мин', exercise: 'Пение интервалов', description: 'Только **восходящие** (текущая группа: ч4/ч5, б3/м3 и т.д.)' },
            { time: '25–30 мин', exercise: 'Пение интервалов', description: 'Только **нисходящие** (те же интервалы)' },
            { time: '30–40 мин', exercise: 'Пение нот', description: 'Пение отдельных нот (C–B) по команде' },
            { time: '40–50 мин', exercise: 'Пение нот', description: 'Имитация, якорные звуки, legato' },
            { time: '50–60 мин', exercise: 'Clefs', description: 'Чтение нот C–B' }
        ]
    }
};

// Функция для обработки markdown-подобного форматирования
function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **жирный**
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *курсив*
}

// Инициализация календаря при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем текущую дату
    currentDate = new Date();
    generateCalendar();
    setupCalendarEventListeners();
    
    // Автоматически выбираем сегодняшний день
    const today = new Date();
    const todayElement = document.querySelector('.calendar-day.today');
    if (todayElement) {
        selectDate(today, todayElement);
    }
});

// Настройка обработчиков событий календаря
function setupCalendarEventListeners() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar();
        });
    }
}

// Генерация календаря
function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Обновляем заголовок
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const monthElement = document.getElementById('currentMonth');
    if (monthElement) {
        monthElement.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Очищаем календарь
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Добавляем заголовки дней недели
    const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Первый день месяца и количество дней
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Определяем день недели первого дня (0 = воскресенье, 1 = понедельник, ...)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Преобразуем в формат Пн=0, Вс=6
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < startDay; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        calendarGrid.appendChild(dayElement);
    }
    
    // Добавляем дни текущего месяца
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dayDate = new Date(year, month, day);
        const dayOfWeek = dayDate.getDay();
        
        dayElement.className = 'calendar-day current-month';
        dayElement.textContent = day;
        
        // Определяем тип расписания для этого дня
        let scheduleType;
        if (dayOfWeek === 1 || dayOfWeek === 5) { // Понедельник, Пятница
            scheduleType = 'monday-friday';
        } else if (dayOfWeek === 3 || dayOfWeek === 0) { // Среда, Воскресенье
            scheduleType = 'wednesday-sunday';
        } else { // Вторник, Четверг, Суббота
            scheduleType = 'other-days';
        }
        
        // Создаем градиент только для упражнений этого дня
        const schedule = schedules[scheduleType];
        if (schedule && schedule.exercises) {
            const exerciseColors = getExerciseColors(schedule.exercises);
            if (exerciseColors.length > 0) {
                dayElement.classList.add('exercises');
                dayElement.style.background = createConicGradient(exerciseColors);
            }
        }
        
        // Отмечаем сегодняшний день
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Добавляем обработчик клика
        dayElement.addEventListener('click', () => selectDate(dayDate, dayElement));
        
        calendarGrid.appendChild(dayElement);
    }
}

// Получить цвета для упражнений
function getExerciseColors(exercises) {
    const exerciseColorMap = {
        'определение интервалов': 'var(--neon-cyan)',
        'сравнение интервалов': 'var(--neon-pink)', 
        'пение интервалов': 'var(--neon-purple)',
        'чтение интервалов': 'var(--neon-green)',
        'абсолютный слух': 'var(--neon-orange)',
        'пение нот': 'var(--neon-blue)',
        'чтение нот': 'var(--neon-yellow)',
        'clefs': 'var(--neon-red)'
    };
    
    return exercises.map(exercise => exerciseColorMap[exercise]).filter(color => color);
}

// Создать conic-gradient для упражнений
function createConicGradient(colors) {
    if (colors.length === 0) return '';
    
    const segmentSize = 360 / colors.length;
    const gradientStops = colors.map((color, index) => {
        const startAngle = index * segmentSize;
        const endAngle = (index + 1) * segmentSize;
        return `${color} ${startAngle}deg ${endAngle}deg`;
    }).join(', ');
    
    return `conic-gradient(from 0deg, ${gradientStops})`;
}

// Выбор даты
function selectDate(date, element) {
    // Убираем выделение с предыдущего дня
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Выделяем выбранный день
    element.classList.add('selected');
    selectedDate = date;
    
    // Показываем расписание
    showScheduleForDate(date);
}

// Показать расписание для выбранного дня
function showScheduleForDate(date) {
    const dayOfWeek = date.getDay();
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    // Обновляем заголовок
    const selectedDateElement = document.getElementById('selectedDate');
    if (selectedDateElement) {
        selectedDateElement.textContent = `${dayNames[dayOfWeek]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
    }
    
    // Определяем тип расписания
    let scheduleType;
    if (dayOfWeek === 1 || dayOfWeek === 5) { // Понедельник, Пятница
        scheduleType = 'monday-friday';
    } else if (dayOfWeek === 3 || dayOfWeek === 0) { // Среда, Воскресенье
        scheduleType = 'wednesday-sunday';
    } else { // Вторник, Четверг, Суббота
        scheduleType = 'other-days';
    }
    
    const schedule = schedules[scheduleType];
    
    // Подсвечиваем соответствующие упражнения в легенде
    highlightLegendItems(schedule.exercises);
    
    // Анализируем выполненные упражнения для выбранной даты
    const completedExercises = analyzeCompletedExercises(date);
    
    // Создаем HTML для расписания
    let html = `
        <div class="schedule-focus">
            <h3>📅 ${schedule.title}</h3>
            <p><em>${schedule.focus}</em></p>
        </div>
    `;
    
    if (schedule.warning) {
        html += `<div class="schedule-warning">${schedule.warning}</div>`;
    }
    
    html += `
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Время</th>
                    <th>Упражнение</th>
                    <th>Как выполнять</th>
                    <th>Выполнено</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Распределяем время последовательно по блокам
    schedule.schedule.forEach(item => {
        const exerciseName = item.exercise.toLowerCase();
        const exerciseDescription = item.description.toLowerCase();
        const timeRange = item.time; // например "0–10 мин"
        
        // Извлекаем длительность блока из строки времени
        const timeMatch = timeRange.match(/(\d+)–(\d+)/);
        const blockDuration = timeMatch ? parseInt(timeMatch[2]) - parseInt(timeMatch[1]) : 10;
        
        // Ищем подходящее выполненное упражнение
        let matchedExercise = null;
        
        // Определяем направление из описания расписания
        const hasAscending = exerciseDescription.includes('восходящ');
        const hasDescending = exerciseDescription.includes('нисходящ');
        const hasHarmonic = exerciseDescription.includes('гармонич');
        
        // Ищем совпадение в выполненных упражнениях
        for (const [key, data] of Object.entries(completedExercises)) {
            let isMatch = false;
            
            console.log(`Проверяем: "${exerciseName}" vs "${key}"`);
            
            // Для упражнений на интервалы - проверяем направление
            if (exerciseName.includes('интервал')) {
                const baseExerciseName = exerciseName.replace('интервалов', 'интервал');
                
                if (key.includes(baseExerciseName)) {
                    const csvHasAscending = key.includes('восходящ');
                    const csvHasDescending = key.includes('нисходящ');
                    const csvHasHarmonic = key.includes('гармонич');
                    
                    console.log(`Найдено совпадение по базовому названию. CSV направления: восх=${csvHasAscending}, нисх=${csvHasDescending}, гарм=${csvHasHarmonic}`);
                    console.log(`Расписание направления: восх=${hasAscending}, нисх=${hasDescending}, гарм=${hasHarmonic}`);
                    
                    // Если в расписании указано направление - проверяем совпадение
                    if (hasAscending) {
                        // Ищем восходящие: либо явно указано, либо НЕ указано (по умолчанию)
                        if (csvHasAscending || (!csvHasAscending && !csvHasDescending && !csvHasHarmonic)) {
                            isMatch = true;
                            console.log('Совпадение: восходящие (явно или по умолчанию)');
                        }
                    } else if (hasDescending && csvHasDescending) {
                        isMatch = true;
                        console.log('Совпадение: нисходящие');
                    } else if (hasHarmonic && csvHasHarmonic) {
                        isMatch = true;
                        console.log('Совпадение: гармонические');
                    } else if (!hasAscending && !hasDescending && !hasHarmonic) {
                        // Если направление не указано в расписании - берем ВОСХОДЯЩИЕ (явно или по умолчанию)
                        if (csvHasAscending || (!csvHasAscending && !csvHasDescending && !csvHasHarmonic)) {
                            isMatch = true;
                            console.log('Совпадение: без направления в расписании = восходящие по умолчанию');
                        }
                    }
                }
            } else {
                // Для других упражнений (Clefs, Абсолютный слух и т.д.) - простое совпадение
                if ((key.includes('clefs') || key.includes('ключ')) && (exerciseName.includes('clefs') || exerciseName.includes('ключ'))) {
                    isMatch = true;
                    console.log('Совпадение: Clefs');
                } else if (key.includes('абсолютный слух') && exerciseName.includes('абсолютный слух')) {
                    isMatch = true;
                    console.log('Совпадение: Абсолютный слух');
                } else if (key.includes('пение нот') && exerciseName.includes('пение нот')) {
                    isMatch = true;
                    console.log('Совпадение: Пение нот');
                } else if (key.includes('чтение нот') && exerciseName.includes('чтение нот')) {
                    isMatch = true;
                    console.log('Совпадение: Чтение нот');
                }
            }
            
            if (isMatch && data.remainingTime > 0) {
                matchedExercise = data;
                console.log(`Выбрано упражнение: ${key}, оставшееся время: ${data.remainingTime}`);
                break;
            }
        }
        
        let status = 'not-done'; // по умолчанию не выполнено
        let timeSpent = '—';
        let allocatedTime = 0;
        
        if (matchedExercise && matchedExercise.remainingTime > 0) {
            // Выделяем время для этого блока
            allocatedTime = Math.min(matchedExercise.remainingTime, blockDuration);
            matchedExercise.remainingTime -= allocatedTime;
            
            // Форматируем время с секундами
            const minutes = Math.floor(allocatedTime);
            const seconds = Math.round((allocatedTime - minutes) * 60);
            
            if (seconds > 0) {
                timeSpent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timeSpent = `${minutes} мин`;
            }
            
            // Определяем статус
            if (allocatedTime >= blockDuration) {
                status = 'completed'; // полностью выполнено
            } else if (allocatedTime > 0) {
                status = 'partial'; // частично выполнено
            }
        }
        
        html += `
            <tr class="exercise-row ${status}">
                <td>${item.time}</td>
                <td><strong>${item.exercise}</strong></td>
                <td>${formatText(item.description)}</td>
                <td class="time-spent">${timeSpent}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    const scheduleContent = document.getElementById('scheduleContent');
    if (scheduleContent) {
        scheduleContent.innerHTML = html;
    }
}

// Анализировать выполненные упражнения для конкретной даты
function analyzeCompletedExercises(date) {
    const dateStr = formatDateForCSV(date);
    const completed = {};
    
    console.log('Анализируем дату:', dateStr);
    
    // Фильтруем данные по выбранной дате
    const dayData = csvData.filter(entry => {
        return entry['Start Date'] === dateStr;
    });
    
    console.log('Найдено записей за день:', dayData.length);
    dayData.forEach(entry => {
        console.log('Запись:', entry['Description'], '|', entry['Duration (h)']);
    });
    
    // Группируем по ПОЛНОМУ описанию упражнений (не объединяем разные варианты)
    dayData.forEach(entry => {
        const desc = entry['Description'] || '';
        
        // Парсим длительность из формата "HH:MM:SS"
        let duration = 0;
        const durationStr = entry['Duration (h)'] || '';
        const timeMatch = durationStr.match(/(\d+):(\d+):(\d+)/);
        
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseInt(timeMatch[3]);
            duration = hours * 60 + minutes + seconds / 60; // в минутах с учетом секунд
        } else {
            // Fallback на decimal если нет формата HH:MM:SS
            duration = parseFloat(entry['Duration (decimal)'] || 0) * 60;
        }
        
        // Используем полное описание как ключ
        const exerciseKey = desc.toLowerCase().trim();
        
        if (exerciseKey) {
            if (!completed[exerciseKey]) {
                completed[exerciseKey] = { time: 0, remainingTime: 0, count: 0, description: desc };
            }
            completed[exerciseKey].time += duration;
            completed[exerciseKey].remainingTime += duration;
            completed[exerciseKey].count += 1;
        }
    });
    
    console.log('Сгруппированные упражнения:', completed);
    return completed;
}

// Форматировать дату для сравнения с CSV (DD/MM/YYYY)
function formatDateForCSV(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Подсветить элементы легенды для выбранных упражнений
function highlightLegendItems(exercises) {
    // Убираем все активные классы
    document.querySelectorAll('.legend-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Маппинг упражнений к номерам в легенде
    const exerciseToLegend = {
        'определение интервалов': 1,
        'сравнение интервалов': 2,
        'пение интервалов': 3,
        'чтение интервалов': 4,
        'абсолютный слух': 5,
        'пение нот': 6,
        'чтение нот': 7,
        'clefs': 8
    };
    
    // Подсвечиваем нужные элементы
    exercises.forEach(exercise => {
        const legendNumber = exerciseToLegend[exercise];
        if (legendNumber) {
            const legendItem = document.querySelector(`.legend-item:nth-child(${legendNumber})`);
            if (legendItem) {
                legendItem.classList.add('active');
            }
        }
    });
}

// Глобальная переменная для текущей недели
let currentWeek = 1;
let totalWeeks = 7; // Будет пересчитываться автоматически

// Функция для подсчета общего количества недель из таблицы
function calculateTotalWeeks() {
    const rows = document.querySelectorAll('#weeksPlan tr[data-week]');
    let maxWeek = 0;
    
    rows.forEach(row => {
        const weekText = row.querySelector('td:first-child').textContent;
        
        // Если есть диапазон недель (например "3-4" или "6-7")
        if (weekText.includes('-')) {
            const [start, end] = weekText.split('-').map(num => parseInt(num.trim()));
            maxWeek = Math.max(maxWeek, end);
        } else {
            const weekNum = parseInt(weekText);
            if (!isNaN(weekNum)) {
                maxWeek = Math.max(maxWeek, weekNum);
            }
        }
    });
    
    totalWeeks = maxWeek;
    return totalWeeks;
}

// Функция для определения, к какой строке относится текущая неделя
function getRowForWeek(weekNumber) {
    const rows = document.querySelectorAll('#weeksPlan tr[data-week]');
    
    for (let row of rows) {
        const weekText = row.querySelector('td:first-child').textContent;
        
        if (weekText.includes('-')) {
            const [start, end] = weekText.split('-').map(num => parseInt(num.trim()));
            if (weekNumber >= start && weekNumber <= end) {
                return row;
            }
        } else {
            const weekNum = parseInt(weekText);
            if (weekNum === weekNumber) {
                return row;
            }
        }
    }
    
    return null;
}

// Функция для смены текущей недели
function changeCurrentWeek(direction) {
    const newWeek = currentWeek + direction;
    
    // Пересчитываем общее количество недель
    calculateTotalWeeks();
    
    // Ограничиваем диапазон недель
    if (newWeek < 1 || newWeek > totalWeeks) {
        return;
    }
    
    currentWeek = newWeek;
    updateWeeksPlan();
}

// Обновить план недель
function updateWeeksPlan() {
    // Убираем класс week-current со всех строк
    document.querySelectorAll('#weeksPlan tr').forEach(row => {
        row.classList.remove('week-current');
        const statusCell = row.querySelector('.status-current, .status-planned');
        if (statusCell) {
            statusCell.className = 'status-planned';
            statusCell.textContent = 'Запланировано';
        }
    });
    
    // Находим строку для текущей недели
    const currentRow = getRowForWeek(currentWeek);
    if (currentRow) {
        currentRow.classList.add('week-current');
        const statusCell = currentRow.querySelector('.status-planned');
        if (statusCell) {
            statusCell.className = 'status-current';
            statusCell.textContent = 'Текущая';
        }
    }
}

// Инициализация системы недель при загрузке
document.addEventListener('DOMContentLoaded', function() {
    calculateTotalWeeks();
    updateWeeksPlan();
});