const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
renderTasks();

// Проверка сохраненной темы
if (localStorage.getItem('dark-theme') === 'true') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = 'Светлая тема';
}

// Добавление задачи
addBtn.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
    }
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

// Сохранение задач
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Отрисовка задач
function renderTasks() {
    // Сортируем задачи: незавершенные вверху, завершенные внизу
    tasks.sort((a, b) => a.completed - b.completed);

    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        if (task.completed) li.classList.add('completed');

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.text}</span>
            <button>Удалить</button>
        `;

        // Чекбокс
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks(); // Перерисовываем, чтобы выполненные ушли вниз
        });

        // Редактирование по двойному клику
        const span = li.querySelector('span');
        span.addEventListener('dblclick', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = task.text;
            li.replaceChild(input, span);
            input.focus();

            input.addEventListener('blur', () => {
                task.text = input.value.trim() || task.text;
                saveTasks();
                renderTasks();
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') input.blur();
            });
        });

        // Удаление с анимацией
        const deleteBtn = li.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            li.classList.add('removing');
            li.addEventListener('animationend', () => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
            });
        });

        taskList.appendChild(li);
    });
}

// Переключение темы
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.textContent = isDark ? 'Светлая тема' : 'Темная тема';
    localStorage.setItem('dark-theme', isDark);
});