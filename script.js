// Получаем элементы DOM
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Массив для хранения задач
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let draggedItem = null;
let dragIndicator = null;
let dropPosition = null;

// Инициализация приложения
function init() {
    // Загрузка сохраненной темы
    loadTheme();
    
    renderTasks();
    updateTaskCounter();
    
    // Добавляем обработчики событий
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    // Обработчик для переключения темы
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Создаем индикатор перетаскивания
    createDragIndicator();
}

// Создаем индикатор перетаскивания
function createDragIndicator() {
    dragIndicator = document.createElement('div');
    dragIndicator.className = 'drag-indicator';
    dragIndicator.style.display = 'none';
    taskList.appendChild(dragIndicator);
}

// Функция добавления новой задачи
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            order: tasks.length // Добавляем порядковый номер
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateTaskCounter();
        
        taskInput.value = '';
        taskInput.focus();
    }
}

// Функция для отображения задач
function renderTasks() {
    taskList.innerHTML = '';
    
    // Пересоздаем индикатор перетаскивания
    createDragIndicator();
    
    const filteredTasks = filterTasks();
    
    // Сортируем задачи по порядку
    filteredTasks.sort((a, b) => a.order - b.order);
    
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-id', task.id);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
        
        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        taskTextSpan.textContent = task.text;
        
        // Добавляем обработчик двойного клика для редактирования
        taskTextSpan.addEventListener('dblclick', () => {
            if (!task.completed) {
                startEditing(taskTextSpan, task.id);
            }
        });
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Удалить';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        actionsDiv.appendChild(deleteBtn);
        
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskTextSpan);
        taskItem.appendChild(actionsDiv);
        
        // Добавляем обработчики для перетаскивания
        taskItem.setAttribute('draggable', 'true');
        taskItem.addEventListener('dragstart', dragStart);
        taskItem.addEventListener('dragend', dragEnd);
        taskItem.addEventListener('dragover', dragOver);
        taskItem.addEventListener('dragenter', dragEnter);
        taskItem.addEventListener('dragleave', dragLeave);
        taskItem.addEventListener('drop', drop);
        
        taskList.appendChild(taskItem);
    });
}

// Функция для начала редактирования задачи
function startEditing(taskTextElement, taskId) {
    const currentText = taskTextElement.textContent;
    taskTextElement.classList.add('editing');
    
    // Создаем поле ввода
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.style.width = '100%';
    input.style.padding = '5px';
    input.style.border = 'none';
    input.style.backgroundColor = 'transparent';
    input.style.color = 'inherit';
    
    // Заменяем текст на поле ввода
    taskTextElement.textContent = '';
    taskTextElement.appendChild(input);
    input.focus();
    
    // Обработчик для завершения редактирования
    function finishEditing() {
        const newText = input.value.trim();
        if (newText) {
            // Обновляем текст задачи
            tasks = tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, text: newText };
                }
                return task;
            });
            
            saveTasks();
            taskTextElement.textContent = newText;
        } else {
            // Если текст пустой, возвращаем старый
            taskTextElement.textContent = currentText;
        }
        
        taskTextElement.classList.remove('editing');
    }
    
    // Обработчики событий для завершения редактирования
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEditing();
        }
    });
}

// Функции для перетаскивания
function dragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    
    // Создаем "призрак" для визуализации
    const ghost = document.createElement('div');
    ghost.className = 'task-item-ghost';
    ghost.style.display = 'none';
    taskList.appendChild(ghost);
    
    // Удаляем все индикаторы перетаскивания
    removeAllDragIndicators();
}

function dragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    
    // Удаляем все индикаторы перетаскивания
    removeAllDragIndicators();
    
    // Скрываем индикатор
    if (dragIndicator) {
        dragIndicator.style.display = 'none';
    }
    
    // Удаляем "призрак"
    const ghost = document.querySelector('.task-item-ghost');
    if (ghost) {
        ghost.remove();
    }
}

function dragOver(e) {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === this) {
        return;
    }
    
    // Определяем позицию курсора относительно элемента
    const rect = this.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Удаляем все индикаторы перетаскивания
    removeAllDragIndicators();
    
    // Показываем индикатор в зависимости от позиции
    if (y < height / 2) {
        // Верхняя половина - вставляем перед
        this.classList.add('drag-over-top');
        dropPosition = 'before';
        
        // Показываем индикатор сверху
        showDragIndicator(this, 'top');
    } else {
        // Нижняя половина - вставляем после
        this.classList.add('drag-over');
        dropPosition = 'after';
        
        // Показываем индикатор снизу
        showDragIndicator(this, 'bottom');
    }
}

// Функция для отображения индикатора перетаскивания
function showDragIndicator(element, position) {
    if (!dragIndicator) return;
    
    const rect = element.getBoundingClientRect();
    const listRect = taskList.getBoundingClientRect();
    
    dragIndicator.className = `drag-indicator ${position}`;
    dragIndicator.style.display = 'block';
    
    if (position === 'top') {
        dragIndicator.style.top = `${element.offsetTop}px`;
    } else {
        dragIndicator.style.top = `${element.offsetTop + element.offsetHeight}px`;
    }
}

// Удаляем все индикаторы перетаскивания
function removeAllDragIndicators() {
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
        item.classList.remove('drag-over-top');
    });
}

function dragEnter(e) {
    e.preventDefault();
}

function dragLeave() {
    this.classList.remove('drag-over');
    this.classList.remove('drag-over-top');
}

function drop(e) {
    e.preventDefault();
    
    // Удаляем все индикаторы перетаскивания
    removeAllDragIndicators();
    
    // Скрываем индикатор
    if (dragIndicator) {
        dragIndicator.style.display = 'none';
    }
    
    if (!draggedItem || draggedItem === this) {
        return;
    }
    
    const draggedId = parseInt(draggedItem.getAttribute('data-id'));
    const targetId = parseInt(this.getAttribute('data-id'));
    
    // Получаем индексы для обновления порядка
    const draggedIndex = tasks.findIndex(task => task.id === draggedId);
    const targetIndex = tasks.findIndex(task => task.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
        return;
    }
    
    // Копируем массив задач
    const newTasks = [...tasks];
    
    // Удаляем перетаскиваемый элемент
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    
    // Определяем новую позицию
    let newIndex = targetIndex;
    if (dropPosition === 'after') {
        newIndex = targetIndex + (draggedIndex < targetIndex ? 0 : 1);
    } else {
        newIndex = targetIndex - (draggedIndex > targetIndex ? 0 : 1);
    }
    
    // Вставляем элемент на новую позицию
    newTasks.splice(newIndex, 0, draggedTask);
    
    // Обновляем порядок всех задач
    newTasks.forEach((task, index) => {
        task.order = index;
    });
    
    // Обновляем массив задач
    tasks = newTasks;
    
    saveTasks();
    renderTasks();
}

// Функция для фильтрации задач
function filterTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Функция для изменения статуса задачи
function toggleTaskStatus(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateTaskCounter();
}

// Функция для удаления задачи
function deleteTask(id) {
    const deletedTaskIndex = tasks.findIndex(task => task.id === id);
    const deletedTaskOrder = tasks[deletedTaskIndex].order;
    
    // Удаляем задачу
    tasks = tasks.filter(task => task.id !== id);
    
    // Обновляем порядок оставшихся задач
    tasks.forEach(task => {
        if (task.order > deletedTaskOrder) {
            task.order--;
        }
    });
    
    saveTasks();
    renderTasks();
    updateTaskCounter();
}

// Функция для очистки завершенных задач
function clearCompleted() {
    // Получаем все завершенные задачи
    const completedTasks = tasks.filter(task => task.completed);
    
    if (completedTasks.length > 0) {
        // Удаляем завершенные задачи и обновляем порядок
        tasks = tasks.filter(task => !task.completed);
        
        // Переназначаем порядок оставшимся задачам
        tasks.forEach((task, index) => {
            task.order = index;
        });
        
        saveTasks();
        renderTasks();
        updateTaskCounter();
    }
}

// Функция для обновления счетчика задач
function updateTaskCounter() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    const taskWord = getTaskWordForm(activeTasks);
    taskCounter.textContent = `${activeTasks} ${taskWord}`;
}

// Функция для правильного склонения слова "задача"
function getTaskWordForm(count) {
    if (count === 1) {
        return 'задача осталась';
    } else if (count >= 2 && count <= 4) {
        return 'задачи осталось';
    } else {
        return 'задач осталось';
    }
}

// Функция для сохранения задач в localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Функция для переключения темы
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Функция для загрузки сохраненной темы
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// Обновляем существующие задачи, добавляя порядок, если его нет
function updateExistingTasks() {
    let needsUpdate = false;
    
    tasks.forEach((task, index) => {
        if (task.order === undefined) {
            task.order = index;
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        saveTasks();
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    updateExistingTasks();
    init();
}); 