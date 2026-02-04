// Функция для обработки markdown-подобного форматирования
function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **жирный**
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *курсив*
}

// Данные расписаний
const schedules = {
    'monday-friday': {
        title: 'ПОНЕДЕЛЬНИК и ПЯТНИЦА',
        focus: 'Фокус: Пение + Чтение интервалов',
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

// Текущая дата и выбранная дата
let currentDate = new Date();
let selectedDate = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    generateCalendar();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar();
    });
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
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Очищаем календарь
    const calendarGrid = document.getElementById('calendarGrid');
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
        
        // Добавляем цветовую маркировку по дням недели
        if (dayOfWeek === 1 || dayOfWeek === 5) { // Понедельник, Пятница
            dayElement.classList.add('monday-friday');
        } else if (dayOfWeek === 3 || dayOfWeek === 0) { // Среда, Воскресенье
            dayElement.classList.add('wednesday-sunday');
        } else { // Вторник, Четверг, Суббота
            dayElement.classList.add('other-days');
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
    showSchedule(date);
}

// Показать расписание для выбранного дня
function showSchedule(date) {
    const dayOfWeek = date.getDay();
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    // Обновляем заголовок
    const selectedDateElement = document.getElementById('selectedDate');
    selectedDateElement.textContent = `${dayNames[dayOfWeek]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
    
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
                </tr>
            </thead>
            <tbody>
    `;
    
    schedule.schedule.forEach(item => {
        html += `
            <tr>
                <td>${item.time}</td>
                <td><strong>${item.exercise}</strong></td>
                <td>${formatText(item.description)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    document.getElementById('scheduleContent').innerHTML = html;
}