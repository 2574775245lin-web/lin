/**
 * To-Do List Application
 * Features:
 * - Add, complete, and delete tasks
 * - Filter tasks (All, Active, Completed)
 * - Local storage persistence
 * - Statistics tracking
 * - Beautiful responsive UI
 */

class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.storageKey = 'todoAppData';
        
        // DOM Elements
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.clearAll = document.getElementById('clearAll');
        
        // Stats Elements
        this.totalCount = document.getElementById('totalCount');
        this.activeCount = document.getElementById('activeCount');
        this.completedCount = document.getElementById('completedCount');
        
        // Filter Buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        this.init();
    }

    /**
     * Initialize the app
     */
    init() {
        this.loadFromStorage();
        this.render();
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Add task
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Clear buttons
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        this.clearAll.addEventListener('click', () => this.clearAllTodos());
    }

    /**
     * Add a new todo
     */
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (!text) {
            this.showNotification('Please enter a task', 'warning');
            return;
        }

        if (text.length > 200) {
            this.showNotification('Task is too long (max 200 characters)', 'warning');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleDateString(),
            createdTime: new Date().toLocaleTimeString()
        };

        this.todos.push(todo);
        this.todoInput.value = '';
        this.todoInput.focus();
        this.saveToStorage();
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    /**
     * Toggle todo completion status
     */
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    /**
     * Delete a todo
     */
    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(t => t.id === id);
        if (todoIndex > -1) {
            const todoItem = this.todoList.querySelector(`[data-id="${id}"]`);
            if (todoItem) {
                todoItem.classList.add('removing');
                setTimeout(() => {
                    this.todos.splice(todoIndex, 1);
                    this.saveToStorage();
                    this.render();
                }, 300);
            }
        }
    }

    /**
     * Clear all completed todos
     */
    clearCompletedTodos() {
        const completedCount = this.todos.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear', 'warning');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
            this.showNotification('Completed tasks cleared!', 'success');
        }
    }

    /**
     * Clear all todos
     */
    clearAllTodos() {
        if (this.todos.length === 0) {
            this.showNotification('No tasks to clear', 'warning');
            return;
        }

        if (confirm(`Delete all ${this.todos.length} task(s)? This action cannot be undone.`)) {
            this.todos = [];
            this.saveToStorage();
            this.render();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    /**
     * Get filtered todos based on current filter
     */
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'all':
            default:
                return this.todos;
        }
    }

    /**
     * Update statistics
     */
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;

        this.totalCount.textContent = total;
        this.activeCount.textContent = active;
        this.completedCount.textContent = completed;
    }

    /**
     * Render the UI
     */
    render() {
        this.updateStats();
        
        const filteredTodos = this.getFilteredTodos();
        
        // Clear list
        this.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.clearCompleted.disabled = true;
            return;
        }

        this.emptyState.classList.add('hidden');
        this.clearCompleted.disabled = this.todos.filter(t => t.completed).length === 0;

        // Render todos
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;
            
            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    data-id="${todo.id}"
                >
                <div style="flex: 1;">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="todo-date">📅 ${todo.createdAt}</span>
                    </div>
                </div>
                <button class="delete-btn" data-id="${todo.id}" title="Delete task">
                    🗑️
                </button>
            `;

            // Add event listeners
            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

            this.todoList.appendChild(li);
        });
    }

    /**
     * Save todos to local storage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving tasks', 'warning');
        }
    }

    /**
     * Load todos from local storage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.todos = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.todos = [];
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show notification (can be enhanced with a toast library)
     */
    showNotification(message, type = 'info') {
        // Simple console notification
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // You can enhance this with a toast notification library
        // For now, we'll use the browser's title to show feedback
    }

    /**
     * Export todos as JSON
     */
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    /**
     * Get todos statistics
     */
    getStats() {
        return {
            total: this.todos.length,
            completed: this.todos.filter(t => t.completed).length,
            active: this.todos.filter(t => !t.completed).length,
            completionRate: this.todos.length > 0 
                ? Math.round((this.todos.filter(t => t.completed).length / this.todos.length) * 100)
                : 0
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
