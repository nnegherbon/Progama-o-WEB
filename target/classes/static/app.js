const API_BASE_URL = 'http://localhost:8080/api';

let currentUser = null;
let categories = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    checkAuthStatus();
    setGreeting();

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = today;
});

function setGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('greeting-time');
    if (!greetingEl) return;
    if (hour < 12) greetingEl.textContent = 'Bom dia,';
    else if (hour < 18) greetingEl.textContent = 'Boa tarde,';
    else greetingEl.textContent = 'Boa noite,';
}

// ===== AUTH =====
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
            showApp();
            loadDashboard();
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
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
            alert('Cadastro realizado! Faça login para continuar.');
            switchTab('login');
            document.getElementById('login-email').value = email;
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        alert('Erro ao cadastrar');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    document.getElementById('app-page').style.display = 'none';
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('auth-page').style.flexDirection = 'column';
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

function checkAuthStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        showApp();
        loadDashboard();
    }
}

function showApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'block';
    const nameEl = document.getElementById('greeting-name');
    if (nameEl && currentUser) nameEl.textContent = currentUser.name + '!';
}

// ===== UI =====
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

function showSection(section, event) {
    if (!currentUser) return;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    if (section === 'dashboard') loadDashboard();
    else if (section === 'transactions') loadTransactions();
}

// ===== DASHBOARD =====
async function loadDashboard() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/user/${currentUser.id}/summary`);
        const summary = await response.json();
        document.getElementById('balance').textContent = formatCurrency(summary.balance);
        document.getElementById('hero-income').textContent = formatCurrency(summary.totalIncome);
        document.getElementById('hero-expense').textContent = formatCurrency(summary.totalExpense);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ===== CATEGORIES =====
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        categories = await response.json();
        document.querySelectorAll('#category, #filter-category').forEach(select => {
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

// ===== TRANSACTIONS =====
async function loadTransactions() {
    if (!currentUser) return;
    try {
        let url = `${API_BASE_URL}/transactions/user/${currentUser.id}`;
        const filterType = document.getElementById('filter-type').value;
        const filterCategory = document.getElementById('filter-category').value;
        if (filterType && filterCategory) url = `${API_BASE_URL}/transactions/user/${currentUser.id}/type/${filterType}/category/${filterCategory}`;
        else if (filterType) url = `${API_BASE_URL}/transactions/user/${currentUser.id}/type/${filterType}`;
        else if (filterCategory) url = `${API_BASE_URL}/transactions/user/${currentUser.id}/category/${filterCategory}`;

        const response = await fetch(url);
        const transactions = await response.json();
        const list = document.getElementById('transactions-list');
        list.innerHTML = '';
        if (transactions.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>Nenhuma transação encontrada</p></div>';
            return;
        }
        transactions.forEach(t => list.appendChild(createTransactionElement(t, true)));
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function createTransactionElement(transaction, showActions = false) {
    const div = document.createElement('div');
    const isExpense = transaction.type === 'EXPENSE';
    div.className = `transaction-item ${isExpense ? 'expense' : 'income'}`;
    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-category">${transaction.categoryIcon || ''} ${transaction.categoryName || ''}</div>
            <div class="transaction-description">${transaction.description}</div>
            <small style="color:#aaa;font-size:0.75rem;">${formatDate(transaction.date)}</small>
        </div>
        <div class="transaction-amount ${isExpense ? 'expense' : 'income'}">
            ${isExpense ? '-' : '+'}R$ ${Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
        </div>
        ${showActions ? `<div class="transaction-actions"><button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">🗑️</button></div>` : ''}
    `;
    return div;
}

async function handleCreateTransaction(e) {
    e.preventDefault();
    if (!currentUser) { alert('Você precisa estar autenticado'); return; }
    const type = document.getElementById('type').value;
    const categoryId = document.getElementById('category').value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    try {
        const response = await fetch(`${API_BASE_URL}/transactions?userId=${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, categoryId: parseInt(categoryId), amount: parseFloat(amount), description, date })
        });
        if (response.ok) {
            alert('Transação registrada!');
            document.getElementById('transaction-form').reset();
            loadTransactions();
            loadDashboard();
        } else {
            const error = await response.json();
            alert('Erro: ' + error.error);
        }
    } catch (error) {
        alert('Erro ao registrar transação');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });
        if (response.ok) { loadTransactions(); loadDashboard(); }
        else alert('Erro ao deletar transação');
    } catch (error) {
        alert('Erro ao deletar transação');
    }
}

// ===== UTILS =====
function formatCurrency(value) {
    if (!value) value = 0;
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}