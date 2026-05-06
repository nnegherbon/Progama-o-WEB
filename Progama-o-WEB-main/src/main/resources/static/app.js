// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Global State
let currentUser = null;
let categories = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
    checkAuthStatus();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('transaction-form').addEventListener('submit', handleCreateTransaction);
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data;
            localStorage.setItem('user', JSON.stringify(data));
            showAuthenticatedUI();
            loadDashboard();
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Erro ao fazer login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            switchTab('login');
            document.getElementById('login-email').value = email;
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Erro ao cadastrar');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    showAuthUI();
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

function checkAuthStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        showAuthenticatedUI();
        loadDashboard();
    } else {
        showAuthUI();
    }
}

// UI Functions
function showAuthUI() {
    document.getElementById('auth-section').classList.add('active');
    document.getElementById('dashboard-section').classList.remove('active');
    document.getElementById('transactions-section').classList.remove('active');
}

function showAuthenticatedUI() {
    document.getElementById('auth-section').classList.remove('active');
}

function showSection(section) {
    if (!currentUser) {
        showAuthUI();
        return;
    }

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(section));
    });

    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'transactions') {
        loadTransactions();
    }
}

function switchTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    if (tab === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('register-form').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// Dashboard Functions
async function loadDashboard() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/user/${currentUser.id}/summary`);
        const summary = await response.json();

        document.getElementById('balance').textContent = formatCurrency(summary.balance);
        document.getElementById('income').textContent = formatCurrency(summary.totalIncome);
        document.getElementById('expense').textContent = formatCurrency(summary.totalExpense);
        renderCategorySummary(summary.expensesByCategory || {});

        loadRecentTransactions();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadRecentTransactions() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/user/${currentUser.id}`);
        const transactions = await response.json();

        const recentList = document.getElementById('recent-list');
        recentList.innerHTML = '';

        if (transactions.length === 0) {
            recentList.innerHTML = '<div class="empty-state"><p>Nenhuma transação registrada</p></div>';
            return;
        }

        transactions.slice(0, 5).forEach(transaction => {
            const item = createTransactionElement(transaction);
            recentList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

function renderCategorySummary(expensesByCategory) {
    const summaryList = document.getElementById('category-summary-list');
    if (!summaryList) return;

    const entries = Object.entries(expensesByCategory);
    summaryList.innerHTML = '';

    if (entries.length === 0) {
        summaryList.innerHTML = '<div class="empty-state"><p>Nenhuma despesa registrada por categoria</p></div>';
        return;
    }

    entries
        .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
        .forEach(([category, value]) => {
            const item = document.createElement('div');
            item.className = 'category-summary-item';
            item.innerHTML = `<span>${category}</span><strong>${formatCurrency(value)}</strong>`;
            summaryList.appendChild(item);
        });
}

// Transactions Functions
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        categories = await response.json();

        const categorySelects = document.querySelectorAll('#category, #filter-category');
        categorySelects.forEach(select => {
            select.innerHTML = '<option value="">Todas as categorias</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = `${cat.icon} ${cat.name}`;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadTransactions() {
    if (!currentUser) return;

    try {
        let url = `${API_BASE_URL}/transactions/user/${currentUser.id}`;
        const filterType = document.getElementById('filter-type').value;
        const filterCategory = document.getElementById('filter-category').value;

        if (filterType && filterCategory) {
            url = `${API_BASE_URL}/transactions/user/${currentUser.id}/type/${filterType}/category/${filterCategory}`;
        } else if (filterType) {
            url = `${API_BASE_URL}/transactions/user/${currentUser.id}/type/${filterType}`;
        } else if (filterCategory) {
            url = `${API_BASE_URL}/transactions/user/${currentUser.id}/category/${filterCategory}`;
        }

        const response = await fetch(url);
        const transactions = await response.json();

        const list = document.getElementById('transactions-list');
        list.innerHTML = '';

        if (transactions.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>Nenhuma transação encontrada</p></div>';
            return;
        }

        transactions.forEach(transaction => {
            const item = createTransactionElement(transaction, true);
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function createTransactionElement(transaction, showActions = false) {
    const div = document.createElement('div');
    const isExpense = transaction.type === 'EXPENSE';
    const amountClass = isExpense ? 'expense' : 'income';
    const amountSign = isExpense ? '-' : '+';

    div.className = `transaction-item ${amountClass}`;
    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-category">
                ${transaction.categoryIcon} ${transaction.categoryName}
            </div>
            <div class="transaction-description">${transaction.description}</div>
            <small>${formatDate(transaction.date)}</small>
        </div>
        <div class="transaction-amount ${amountClass}">
            ${amountSign}R$ ${Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
        </div>
        ${showActions ? `
            <div class="transaction-actions">
                <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">🗑️</button>
            </div>
        ` : ''}
    `;

    return div;
}

async function handleCreateTransaction(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Você precisa estar autenticado');
        return;
    }

    const type = document.getElementById('type').value;
    const categoryId = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions?userId=${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                categoryId: parseInt(categoryId),
                amount: parseFloat(amount),
                description,
                date
            })
        });

        if (response.ok) {
            alert('Transação registrada com sucesso!');
            document.getElementById('transaction-form').reset();
            loadTransactions();
            loadDashboard();
        } else {
            const error = await response.json();
            alert('Erro: ' + error.error);
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        alert('Erro ao registrar transação');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Transação deletada com sucesso!');
            loadTransactions();
            loadDashboard();
        } else {
            alert('Erro ao deletar transação');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Erro ao deletar transação');
    }
}

// Utility Functions
function formatCurrency(value) {
    if (!value) value = 0;
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
    }
});
