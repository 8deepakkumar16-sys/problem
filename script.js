class StudentTimeManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('studentTasks')) || [];
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.updateTimeDisplay();
        this.renderTasks();
        this.bindEvents();
        this.updateStats();
        setInterval(() => this.updateTimeDisplay(), 1000);
    }

    updateTimeDisplay() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    bindEvents() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Category filters
        document.querySelectorAll('.category').forEach(category => {
            category.addEventListener('click', (e) => this.filterTasks(e.currentTarget.dataset.category));
        });
    }

    openModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (task) {
            this.currentEditingId = task.id;
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDuration').value = task.duration;
            document.getElementById('taskDate').value = task.date;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskCompleted').checked = task.completed;
        } else {
            this.currentEditingId = null;
            document.getElementById('modalTitle').textContent = 'Add New Task';
            form.reset();
            document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.currentEditingId = null;
    }

    saveTask() {
        const task = {
            id: this.currentEditingId || Date.now().toString(),
            name: document.getElementById('taskName').value,
            duration: parseInt(document.getElementById('taskDuration').value),
            date: document.getElementById('taskDate').value,
            category: document.getElementById('taskCategory').value,
            completed: document.getElementById('taskCompleted').checked,
            createdAt: new Date().toISOString()
        };

        if (this.currentEditingId) {
            const index = this.tasks.findIndex(t => t.id === this.currentEditingId);
            this.tasks[index] = task;
        } else {
            this.tasks.push(task);
        }

        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.closeModal();
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToStorage();
            this.renderTasks();
            this.updateStats();
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.renderTasks();
            this.updateStats();
        }
    }

    filterTasks(category) {
        document.querySelectorAll('.category').forEach(cat => cat.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.renderTasks(category);
    }

    renderTasks(filter = 'all') {
        const tasksList = document.getElementById('tasksList');
        let filteredTasks = this.tasks;

        if (filter !== 'all') {
            filteredTasks = this.tasks.filter(task => task.category === filter);
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No ${filter === 'all' ? 'tasks' : filter} yet</h3>
                    <p>Add your first ${filter === 'all' ? 'task' : filter} to get started!</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${this.escapeHtml(task.name)}</div>
                    <span class="task-category category-${task.category}">${this.getCategoryName(task.category)}</span>
                </div>
                <div class="task-time">
                    <i class="fas fa-stopwatch"></i> ${task.duration} min • 
                    <i class="fas fa-calendar"></i> ${new Date(task.date).toLocaleDateString()}
                </div>
                <div class="task-actions">
                    <button class="btn btn-complete" onclick="app.toggleComplete('${task.id}')">
                        ${task.completed ? '⏸️ Pause' : '✅ Complete'}
                    </button>
                    <button class="btn btn-edit" onclick="app.openModal(${JSON.stringify(task)})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="app.deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateCategoryCounts();
    }

    updateCategoryCounts() {
        const counts = {
            all: this.tasks.length,
            study: this.tasks.filter(t => t.category === 'study').length,
            exercise: this.tasks.filter(t => t.category === 'exercise').length,
            personal: this.tasks.filter(t => t.category === 'personal').length
        };

        Object.keys(counts).forEach(key => {
            const element = document.getElementById(key + 'Count');
            if (element) element.textContent = counts[key];
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('productivityScore').textContent = productivity + '%';
    }

    getCategoryName(category) {
        const names = {
            study: 'Study',
            exercise: 'Exercise',
            personal: 'Personal'
        };
        return names[category] || category;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    saveToStorage() {
        localStorage.setItem('studentTasks', JSON.stringify(this.tasks));
    }
}

// Initialize app
const app = new StudentTimeManager();
// Add these methods to your StudentTimeManager class

// Enhanced initialization with stagger animations
init() {
    this.updateTimeDisplay();
    this.renderTasks();
    this.bindEvents();
    this.updateStats();
    this.staggerAnimation();
    setInterval(() => this.updateTimeDisplay(), 1000);
}

// Stagger animation for elements
staggerAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 0.1}s`;
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.task-item, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// Enhanced task rendering with animation classes
renderTasks(filter = 'all') {
    const tasksList = document.getElementById('tasksList');
    let filteredTasks = this.tasks;

    if (filter !== 'all') {
        filteredTasks = this.tasks.filter(task => task.category === filter);
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = this.getEmptyStateHTML(filter);
        return;
    }

    tasksList.innerHTML = filteredTasks.map((task, index) => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="animation-delay: ${index * 0.1}s">
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.name)}</div>
                <span class="task-category category-${task.category}">${this.getCategoryName(task.category)}</span>
            </div>
            <div class="task-time">
                <i class="fas fa-stopwatch"></i> ${task.duration} min • 
                <i class="fas fa-calendar"></i> ${new Date(task.date).toLocaleDateString()}
            </div>
            <div class="task-actions">
                <button class="btn btn-complete" onclick="app.toggleComplete('${task.id}')">
                    ${task.completed ? '⏸️ Pause' : '✅ Complete'}
                </button>
                <button class="btn btn-edit" onclick="app.openModal(${JSON.stringify(task)})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-delete" onclick="app.deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Trigger stagger animation
    setTimeout(() => this.staggerAnimation(), 100);
    
    this.updateCategoryCounts();
}

// Enhanced empty state
getEmptyStateHTML(filter) {
    return `
        <div class="empty-state">
            <i class="fas fa-${filter === 'all' ? 'tasks' : filter === 'study' ? 'book' : filter === 'exercise' ? 'dumbbell' : 'heart'}"></i>
            <h3>No ${filter === 'all' ? 'tasks' : filter} yet</h3>
            <p style="animation-delay: 0.3s;">Add your first ${filter === 'all' ? 'task' : filter} to get started!</p>
            <button class="add-task-btn" style="margin-top: 25px; animation-delay: 0.5s;" onclick="app.openModal()">
                <i class="fas fa-plus"></i> Add First Task
            </button>
        </div>
    `;
}

// Add confetti effect for task completion
toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            this.showConfetti();
        }
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
    }
}

showConfetti() {
    // Simple confetti effect
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'][Math.floor(Math.random() * 5)]};
            top: -10px;
            left: ${Math.random() * 100}vw;
            animation: confettiFall 3s linear forwards;
            pointer-events: none;
            z-index: 9999;
            border-radius: 50%;
        `;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Add to CSS for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
