const API_BASE_URL = `${window.location.origin}/api`;
let currentUser = null;
let allTransactions = [];
let categories = [];
let accounts = [];
let creditCards = [];
let limits = [];
let gastosChartInstance = null;
let relChartExpense = null;
let relChartIncome = null;
let relEntSaiChart = null;
let relViewMode = 'list';
let relFilterMode = 'all';
let editingTransactionId = null;
let lancSearchTerm = '';
let incomeLimits = [];

const monthState = { lanc: new Date(), rel: new Date(), lim: new Date() };
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setGreeting();
    renderMonthLabels();
    setupDropdownClose();
    const today = new Date().toISOString().split('T')[0];
    const qDate = document.getElementById('q-date');
    if (qDate) qDate.value = today;
    const limMonth = document.getElementById('lim-month');
    if (limMonth) limMonth.value = today.slice(0,7);
    const limIncomeMonth = document.getElementById('lim-income-month');
    if (limIncomeMonth) limIncomeMonth.value = today.slice(0,7);
    document.addEventListener('keydown', handleGlobalKeydown);
});

function setGreeting() {
    const h = new Date().getHours();
    const el = document.getElementById('greeting-time');
    if (el) el.textContent = h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
}

function renderMonthLabels() {
    ['lanc','rel','lim'].forEach(k => {
        const el = document.getElementById(`${k}-month-label`);
        if (el) el.textContent = `${MONTHS[monthState[k].getMonth()]} ${monthState[k].getFullYear()}`;
    });
}

function changeMonth(dir, key) {
    monthState[key] = new Date(monthState[key].getFullYear(), monthState[key].getMonth() + dir, 1);
    renderMonthLabels();
    if (key === 'lim') {
        updateLimEmptyMsg();
        renderActiveLimitTab();
    }
    if (key === 'lanc') loadLancamentos();
    if (key === 'rel') loadRelatorios();
}

function updateLimEmptyMsg() {
    const el = document.getElementById('lim-empty-msg');
    if (el) el.textContent = `Nenhum limite de gasto definido em ${MONTHS[monthState.lim.getMonth()]} ${monthState.lim.getFullYear()}`;
}

// ===== AUTH =====
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_BASE_URL}/users/login`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data;
            localStorage.setItem('user', JSON.stringify(data));
            showApp();
            await fetchAppData();
            loadDashboard();
        } else alert('Erro: ' + data.error);
    } catch { alert('Erro ao fazer login. Verifique se o backend esta rodando em http://localhost:8080/api'); }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const res = await fetch(`${API_BASE_URL}/users/register`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Cadastro realizado! Faça login para continuar.');
            switchTab('login');
            document.getElementById('login-email').value = email;
        } else alert('Erro: ' + data.error);
    } catch { alert('Erro ao cadastrar'); }
}

function logout() {
    currentUser = null; allTransactions = [];
    accounts = []; creditCards = []; limits = [];
    localStorage.removeItem('user');
    document.getElementById('app-page').style.display = 'none';
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('auth-page').style.flexDirection = 'column';
    closeProfileMenu();
}

function checkAuthStatus() {
    const u = localStorage.getItem('user');
    if (u) {
        currentUser = JSON.parse(u);
        showApp();
        fetchAppData().then(() => loadDashboard());
    }
}

function showApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'block';
    const el = document.getElementById('greeting-name');
    if (el && currentUser) el.textContent = (currentUser.name || 'Usuário') + '!';
    syncProfileForm();
}

function switchTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab === 'login' ? 'login-form' : 'register-form').classList.add('active');
    document.querySelectorAll('.tab-btn')[tab === 'login' ? 0 : 1].classList.add('active');
}

// ===== FETCH DATA =====
async function fetchAppData() {
    await Promise.all([
        loadCategories(),
        fetchAllTransactions(),
        fetchAccounts(),
        fetchCreditCards(),
        fetchLimitsForMonth(getMonthKey(new Date()))
    ]);
}

async function fetchAllTransactions() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/transactions/user/${currentUser.id}`);
        allTransactions = await res.json();
        if (!Array.isArray(allTransactions)) allTransactions = [];
    } catch(e) { console.error(e); allTransactions = []; }
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const data = await res.json();
        categories = Array.isArray(data) ? data : [];
    } catch(e) { console.error(e); categories = []; }
}

async function fetchAccounts() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/accounts`);
        const data = await res.json();
        accounts = Array.isArray(data) ? data : [];
    } catch(e) { console.error(e); accounts = []; }
}

async function fetchCreditCards() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/cards`);
        const data = await res.json();
        creditCards = Array.isArray(data) ? data : [];
    } catch(e) { console.error(e); creditCards = []; }
}

async function fetchLimitsForMonth(monthKey) {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/limits?month=${monthKey}&type=EXPENSE`);
        const data = await res.json();
        limits = Array.isArray(data) ? data : [];
    } catch(e) { console.error(e); limits = []; }
}

async function fetchIncomeLimitsForMonth(monthKey) {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/limits?month=${monthKey}&type=INCOME`);
        const data = await res.json();
        incomeLimits = Array.isArray(data) ? data : [];
    } catch(e) { console.error(e); incomeLimits = []; }
}

// ===== NAVIGATION =====
function showSection(section, event) {
    if (!currentUser) return;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const target = event && event.target ? event.target : null;
    if (target && target.classList.contains('nav-btn')) target.classList.add('active');
    if (section === 'dashboard') loadDashboard();
    if (section === 'lancamentos') loadLancamentos();
    if (section === 'relatorios') loadRelatorios();
    if (section === 'limites') renderActiveLimitTab();
}

// ===== DASHBOARD =====
async function loadDashboard() {
    if (!currentUser) return;
    await Promise.all([
        fetchAllTransactions(),
        fetchAccounts(),
        fetchCreditCards(),
        fetchLimitsForMonth(getMonthKey(new Date()))
    ]);

    const now = new Date();
    const monthTx = allTransactions.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = monthTx.filter(t => t.type === 'INCOME').reduce((a,t) => a+t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'EXPENSE').reduce((a,t) => a+t.amount, 0);
    const transactionBalance = income - expense;
    const accountBalance = accounts.reduce((total, account) => total + Number(account.balance || 0), 0);
    const balance = accounts.length ? accountBalance : transactionBalance;

    setElText('balance-val', formatCurrency(balance));
    setElText('hero-income', formatCurrency(income));
    setElText('hero-expense', formatCurrency(expense));
    setElText('faturas-val', formatCurrency(creditCards.reduce((total, card) => total + Number(card.limitAmount || 0), 0)));

    renderAccountsCard();
    renderCardsCard();
    renderContasPagar();
    renderContasReceber();
    renderGastosCard();
    renderLimitesCard();
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ===== CARD TOGGLE =====
function toggleCard(bodyId, btn) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const isCollapsed = body.classList.contains('collapsed');
    if (isCollapsed) {
        body.classList.remove('collapsed');
        btn.style.transform = '';
    } else {
        body.classList.add('collapsed');
        btn.style.transform = 'rotate(180deg)';
    }
    btn.setAttribute('aria-expanded', String(isCollapsed));
}

// ===== VISIBILITY TOGGLE (eye button) =====
function toggleVisibility(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const isHidden = el.classList.toggle('hidden');
    const eyeBtn = document.querySelector(`[onclick="toggleVisibility('${elId}')"]`);
    if (eyeBtn) {
        eyeBtn.innerHTML = isHidden ? iconEyeOff() : iconEye();
        eyeBtn.setAttribute('aria-label', isHidden ? 'Mostrar valor' : 'Ocultar valor');
    }
}

function iconEye() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function iconEyeOff() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6"/><path d="M9.9 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3 4.1"/><path d="M6.1 6.8C3.5 8.6 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5-1.2"/></svg>`;
}

function iconUser() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.7-4 4.4-6 8-6s6.3 2 8 6"/></svg>`;
}

function iconSettings() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-1.7-1L15 6.5h-6L8.6 9a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 1.7 1l.4 2.5h6l.4-2.5a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.5-2.1-1.5Z"/></svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.eye-btn').forEach(btn => {
        if (!btn.innerHTML.includes('<svg')) btn.innerHTML = iconEye();
        btn.setAttribute('aria-label', 'Ocultar valor');
    });
    const profileBtn = document.getElementById('profile-menu-btn');
    if (profileBtn) profileBtn.innerHTML = iconUser();
    const settingsBtn = document.getElementById('settings-menu-btn');
    if (settingsBtn) settingsBtn.innerHTML = iconSettings();
});

// ===== ACCOUNTS / CARDS =====
function renderAccountsCard() {
    const body = document.getElementById('accounts-list');
    if (!body) return;

    if (!accounts.length) {
        body.innerHTML = `<div class="card-empty-state">
            <span class="card-empty-icon">$</span>
            <p>Adicione sua primeira conta</p>
        </div>`;
        return;
    }

    body.innerHTML = accounts.map(account => `<div class="account-item">
        <div>
            <div class="account-name">${escapeHtml(account.name)}</div>
            <div class="account-type">${formatAccountType(account.type)}</div>
        </div>
        <strong>${formatCurrency(account.balance)}</strong>
        <button class="mini-action danger" onclick="deleteAccount(${account.id})" title="Excluir conta">x</button>
    </div>`).join('');
}

function renderCardsCard() {
    const body = document.getElementById('cards-list');
    if (!body) return;

    if (!creditCards.length) {
        body.innerHTML = `<div class="card-empty-state">
            <span class="card-empty-icon card-icon-sm">CARD</span>
            <p>Adicione o seu primeiro cartao</p>
        </div>`;
        return;
    }

    body.innerHTML = creditCards.map(card => `<div class="credit-card-preview">
        <div class="credit-card-brand">${escapeHtml(card.brand)}</div>
        <div class="credit-card-number">**** **** **** ${escapeHtml(card.lastFour)}</div>
        <div class="credit-card-row">
            <span>${escapeHtml(card.name)}</span>
            <strong>${formatCurrency(card.limitAmount)}</strong>
        </div>
        <button class="mini-action card-delete" onclick="deleteCreditCard(${card.id})" title="Excluir cartao">x</button>
    </div>`).join('');
}

function openAccountsModal() {
    renderAccountsModalList();
    document.getElementById('accounts-modal').style.display = 'flex';
}

function closeAccountsModal() {
    document.getElementById('accounts-modal').style.display = 'none';
}

function openCardsModal() {
    renderCardsModalList();
    document.getElementById('cards-modal').style.display = 'flex';
}

function closeCardsModal() {
    document.getElementById('cards-modal').style.display = 'none';
}

function renderAccountsModalList() {
    const list = document.getElementById('accounts-modal-list');
    if (!list) return;
    list.innerHTML = accounts.length ? accounts.map(account => `<div class="modal-list-item">
        <span>${escapeHtml(account.name)} <small>${formatAccountType(account.type)}</small></span>
        <strong>${formatCurrency(account.balance)}</strong>
        <button type="button" class="mini-action danger" onclick="deleteAccount(${account.id})">x</button>
    </div>`).join('') : '<p class="modal-empty">Nenhuma conta cadastrada.</p>';
}

function renderCardsModalList() {
    const list = document.getElementById('cards-modal-list');
    if (!list) return;
    list.innerHTML = creditCards.length ? creditCards.map(card => `<div class="modal-list-item">
        <span>${escapeHtml(card.name)} <small>${escapeHtml(card.brand)} final ${escapeHtml(card.lastFour)}</small></span>
        <strong>${formatCurrency(card.limitAmount)}</strong>
        <button type="button" class="mini-action danger" onclick="deleteCreditCard(${card.id})">x</button>
    </div>`).join('') : '<p class="modal-empty">Nenhum cartao cadastrado.</p>';
}

async function handleAddAccount(e) {
    e.preventDefault();
    const name = document.getElementById('account-name').value.trim();
    const type = document.getElementById('account-type').value;
    const balance = parseFloat(document.getElementById('account-balance').value || '0');
    if (!name || !type || Number.isNaN(balance)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, balance })
        });
        if (!res.ok) throw await res.json();
        e.target.reset();
        await fetchAccounts();
        renderAccountsCard();
        renderAccountsModalList();
        loadDashboard();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel salvar a conta'));
    }
}

async function deleteAccount(id) {
    if (!confirm('Excluir esta conta?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/accounts/${id}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json();
        await fetchAccounts();
        renderAccountsCard();
        renderAccountsModalList();
        loadDashboard();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel excluir a conta'));
    }
}

async function handleAddCard(e) {
    e.preventDefault();
    const name = document.getElementById('card-name').value.trim();
    const brand = document.getElementById('card-brand').value.trim();
    const limitAmount = parseFloat(document.getElementById('card-limit').value || '0');
    const lastFour = document.getElementById('card-last-four').value.trim();
    if (!name || !brand || !/^\d{4}$/.test(lastFour) || Number.isNaN(limitAmount)) {
        alert('Preencha todos os campos. O final precisa ter 4 digitos.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, brand, limitAmount, lastFour })
        });
        if (!res.ok) throw await res.json();
        e.target.reset();
        await fetchCreditCards();
        renderCardsCard();
        renderCardsModalList();
        loadDashboard();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel salvar o cartao'));
    }
}

async function deleteCreditCard(id) {
    if (!confirm('Excluir este cartao?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/cards/${id}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json();
        await fetchCreditCards();
        renderCardsCard();
        renderCardsModalList();
        loadDashboard();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel excluir o cartao'));
    }
}

function formatAccountType(type) {
    const map = { CHECKING: 'Conta corrente', SAVINGS: 'Poupanca', CASH: 'Dinheiro', INVESTMENT: 'Investimento' };
    return map[type] || type;
}

// ===== CONTAS A PAGAR =====
function renderContasPagar() {
    const body = document.getElementById('pagar-body');
    if (!body) return;
    const today = new Date();
    today.setHours(0,0,0,0);

    const overdue = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = parseLocalDate(t.date);
        d.setHours(0,0,0,0);
        return d < today;
    });

    const upcoming = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = parseLocalDate(t.date);
        d.setHours(0,0,0,0);
        return d > today;
    });

    if (!overdue.length && !upcoming.length) {
        body.innerHTML = '<div class="card-empty-state alone"><p>No momento você não possui contas a pagar</p></div>';
        return;
    }

    let html = '';
    if (overdue.length) {
        html += `<div class="pagar-overdue-banner">⚠ Contas a pagar atrasadas (${overdue.length})</div>`;
        overdue.forEach(t => {
            html += buildPagarItem(t, true);
        });
    }
    upcoming.forEach(t => {
        html += buildPagarItem(t, false);
    });
    body.innerHTML = html;
}

function buildPagarItem(t, isOverdue) {
    return `<div class="pagar-item">
        <div class="pagar-item-icon">${t.categoryIcon || '🏦'}</div>
        <div class="pagar-item-info">
            <div class="pagar-item-name">${t.description}</div>
            <div class="pagar-item-sub">${t.categoryName || ''} · Venc. ${formatDate(t.date)}</div>
        </div>
        <div class="pagar-item-amount" style="color:${isOverdue ? 'var(--red)' : '#f59e0b'}">
            R$ ${Math.abs(t.amount).toFixed(2).replace('.',',')}
        </div>
    </div>`;
}

function renderContasReceber() {
    const body = document.getElementById('receber-body');
    if (!body) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const receivables = allTransactions
        .filter(t => t.type === 'INCOME')
        .filter(t => {
            const d = parseLocalDate(t.date);
            d.setHours(0,0,0,0);
            return d >= today;
        })
        .sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date))
        .slice(0, 4);

    if (!receivables.length) {
        body.innerHTML = '<div class="card-empty-state alone"><p>No momento voce nao possui contas a receber pendentes</p></div><button class="manage-btn" onclick="openQuickAdd(\'INCOME\')">Cadastrar conta a receber</button>';
        return;
    }

    body.innerHTML = receivables.map(t => `<div class="pagar-item income-item">
        <div class="pagar-item-icon">${t.categoryIcon || '+'}</div>
        <div class="pagar-item-info">
            <div class="pagar-item-name">${escapeHtml(t.description)}</div>
            <div class="pagar-item-sub">${escapeHtml(t.categoryName || '')} - Prev. ${formatDate(t.date)}</div>
        </div>
        <div class="pagar-item-amount" style="color:var(--green)">
            ${formatCurrency(t.amount)}
        </div>
    </div>`).join('') + '<button class="manage-btn" onclick="openQuickAdd(\'INCOME\')">Cadastrar conta a receber</button>';
}

// ===== MAIORES GASTOS CARD =====
function renderGastosCard() {
    const ctx = document.getElementById('gastosChart');
    const listEl = document.getElementById('gastos-list');
    if (!listEl) return;
    if (gastosChartInstance) { gastosChartInstance.destroy(); gastosChartInstance = null; }

    const now = new Date();
    const expenses = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = parseLocalDate(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (!expenses.length) {
        listEl.innerHTML = '<div class="card-empty-state alone"><p>Sem gastos no período</p></div>';
        if (ctx) {
            gastosChartInstance = new Chart(ctx, {
                type:'doughnut', data:{ datasets:[{ data:[1], backgroundColor:['#e8e8e8'], borderWidth:0 }] },
                options:{ cutout:'70%', plugins:{ legend:{ display:false } }, animation:false }
            });
        }
        return;
    }

    const groups = {};
    expenses.forEach(t => {
        const k = t.categoryName || 'Outros';
        if (!groups[k]) groups[k] = { icon: t.categoryIcon || '📦', total: 0 };
        groups[k].total += t.amount;
    });
    const sorted = Object.entries(groups).sort((a,b) => b[1].total - a[1].total);
    const total = sorted.reduce((a,[,g]) => a + g.total, 0);
    const colors = ['#EFB4B4','#494FDF','#C1D8C0','#f59e0b','#6262D3','#CF0404','#BEBEBE','#14A10C'];

    listEl.innerHTML = sorted.slice(0,5).map(([name, g], i) => {
        const pct = ((g.total/total)*100).toFixed(1);
        return `<div class="gastos-item">
            <div class="gastos-item-icon" style="background:${colors[i]||'#888'}">${g.icon}</div>
            <div class="gastos-item-name">${name}</div>
            <div class="gastos-item-pct">${pct}%</div>
        </div>`;
    }).join('');

    if (ctx) {
        gastosChartInstance = new Chart(ctx, {
            type:'doughnut',
            data:{
                labels: sorted.map(([n]) => n),
                datasets:[{ data: sorted.map(([,g]) => g.total), backgroundColor: colors.slice(0, sorted.length), borderWidth:0 }]
            },
            options:{ cutout:'65%', plugins:{ legend:{ display:false } } }
        });
    }
}

// ===== LIMITES CARD (dashboard) =====
function renderLimitesCard() {
    const body = document.getElementById('limites-body');
    if (!body) return;
    if (!limits.length) {
        body.innerHTML = '<div class="card-empty-state alone"><p>Você não possui limites configurados</p></div><button class="manage-btn" onclick="showSection(\'limites\',{target:document.querySelectorAll(\'.nav-btn\')[3]})">Definir limites</button>';
        return;
    }
    body.innerHTML = limits.map(l => {
        const spent = Number(l.spent || 0);
        const amount = Number(l.amount || 0);
        const pct = Math.min(Number(l.percentage || 0), 100);
        const fillClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
        return `<div class="lim-item">
            <div class="lim-item-header">
                <div class="lim-item-name">${getCategoryEmoji(l.categoryKey)} ${escapeHtml(l.categoryName)}</div>
                <div class="lim-item-vals">${formatCurrency(spent)} / ${formatCurrency(amount)}</div>
            </div>
            <div class="lim-progress-bar"><div class="lim-progress-fill ${fillClass}" style="width:${pct.toFixed(1)}%"></div></div>
        </div>`;
    }).join('');
}

// ===== QUICK ADD MODAL =====
function openQuickAdd(type) {
    editingTransactionId = null;
    const form = document.getElementById('quick-modal').querySelector('form');
    if (form) form.reset();
    const typeEl = document.getElementById('q-type');
    if (typeEl) typeEl.value = type;
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = type === 'EXPENSE' ? 'Nova Despesa' : 'Nova Receita';
    const dateEl = document.getElementById('q-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    populateModalCategories();
    if (form) form.dataset.mode = 'create';
    document.getElementById('quick-modal').style.display = 'flex';
}
function closeQuickModal() {
    document.getElementById('quick-modal').style.display = 'none';
    editingTransactionId = null;
}

function openTransactionModalFromLancamentos(type) {
    openQuickAdd(type);
    showSection('lancamentos', { target: document.querySelectorAll('.nav-btn')[1] });
}

function openEditTransaction(id) {
    const transaction = allTransactions.find(t => Number(t.id) === Number(id));
    if (!transaction) return;
    editingTransactionId = id;
    document.getElementById('q-type').value = transaction.type;
    document.getElementById('q-amount').value = transaction.amount;
    document.getElementById('q-description').value = transaction.description;
    document.getElementById('q-date').value = transaction.date;
    populateModalCategories();
    document.getElementById('q-category').value = transaction.categoryId;
    document.getElementById('modal-title').textContent = 'Editar Lançamento';
    const form = document.getElementById('quick-modal').querySelector('form');
    if (form) form.dataset.mode = 'edit';
    document.getElementById('quick-modal').style.display = 'flex';
}

function populateModalCategories() {
    const sel = document.getElementById('q-category');
    if (!sel) return;
    sel.innerHTML = '';
    const source = categories.length ? categories : [{ id: 1, name: 'Outros', icon: '' }];
    source.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = `${c.icon || ''} ${c.name}`.trim();
        sel.appendChild(o);
    });
}

document.addEventListener('change', e => {
    if (e.target && e.target.id === 'q-type') populateModalCategories();
    if (e.target && e.target.closest('.lanc-filters')) renderLancamentos();
    if (e.target && e.target.id === 'considerar-nao-pagas') loadRelatorios();
});

document.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('filter-search-btn')) {
        toggleLancSearch();
    }
});

async function handleQuickAdd(e) {
    e.preventDefault();
    if (!currentUser) return;
    const type = document.getElementById('q-type').value;
    const amount = parseFloat(document.getElementById('q-amount').value);
    const description = document.getElementById('q-description').value;
    const date = document.getElementById('q-date').value;
    const categoryId = parseInt(document.getElementById('q-category').value, 10);
    try {
        const url = editingTransactionId
            ? `${API_BASE_URL}/transactions/${editingTransactionId}`
            : `${API_BASE_URL}/transactions?userId=${currentUser.id}`;
        const res = await fetch(url, {
            method: editingTransactionId ? 'PUT' : 'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ type, categoryId, amount, description, date })
        });
        if (res.ok) {
            closeQuickModal();
            document.getElementById('quick-modal').querySelector('form').reset();
            editingTransactionId = null;
            await fetchAllTransactions();
            loadDashboard();
            loadLancamentos();
        } else { const err = await res.json(); alert('Erro: ' + err.error); }
    } catch { alert('Erro ao salvar'); }
}

function closeModalOutside(e) {
    if (e.target === e.currentTarget) {
        closeQuickModal();
        closeLimitModal();
        closeAccountsModal();
        closeCardsModal();
        closeProfileModal();
    }
}

// ===== LANÇAMENTOS =====
function getFilteredTransactions() {
    const m = monthState.lanc;
    return allTransactions.filter(t => {
        const d = parseLocalDate(t.date);
        if (d.getMonth() !== m.getMonth() || d.getFullYear() !== m.getFullYear()) return false;
        if (lancSearchTerm) {
            const haystack = normalizeText(`${t.description || ''} ${t.categoryName || ''} ${t.type || ''}`);
            if (!haystack.includes(normalizeText(lancSearchTerm))) return false;
        }

        const checked = Array.from(document.querySelectorAll('.lanc-filters input[type=checkbox]:checked')).map(cb => cb.value);
        if (!checked.length) return true;

        const typeMatch = checked.some(value =>
            (value.startsWith('receitas') && t.type === 'INCOME') ||
            (value.startsWith('despesas') && t.type === 'EXPENSE')
        );
        const categoryKey = normalizeText(t.categoryName || '');
        const categoryMatch = checked.some(value => categoryKey.includes(value.replace('-d', '').replace('-r', '')));

        const hasTypeFilter = checked.some(value => value.startsWith('receitas') || value.startsWith('despesas'));
        const hasCategoryFilter = checked.some(value => !value.startsWith('receitas') && !value.startsWith('despesas') && value !== 'fixos' && value !== 'parcelados');

        return (!hasTypeFilter || typeMatch) && (!hasCategoryFilter || categoryMatch);
    });
}

async function loadLancamentos() {
    await fetchAllTransactions();
    renderLancamentos();
}

function renderLancamentos() {
    const list = document.getElementById('lanc-list');
    if (!list) return;
    const transactions = getFilteredTransactions();
    const today = new Date(); today.setHours(0,0,0,0);

    if (!transactions.length) {
        list.innerHTML = '<div class="page-empty-state"><div class="empty-icon-circle">!</div><p>Nenhuma movimentação no período.</p></div>';
        updateLancFooter([]);
        return;
    }

    const sorted = [...transactions].sort((a,b) => parseLocalDate(b.date) - parseLocalDate(a.date));
    list.innerHTML = sorted.map(t => {
        const isExp = t.type === 'EXPENSE';
        const d = parseLocalDate(t.date); d.setHours(0,0,0,0);
        const isOverdue = isExp && d < today;
        const isFuture = isExp && d > today;
        let badge = '';
        if (isOverdue) badge = '<span class="lanc-item-badge" style="background:#ffe0e0;color:var(--red);">Atrasada</span>';
        else if (isFuture) badge = '<span class="lanc-item-badge" style="background:#e8f4fd;color:#0369a1;">A vencer</span>';
        return `<div class="lanc-item ${isExp ? 'expense' : 'income'} ${isOverdue ? 'overdue' : ''}">
            <div class="lanc-item-icon ${isExp ? 'expense-icon' : 'income-icon'}">${t.categoryIcon || (isExp ? '💸' : '💰')}</div>
            <div class="lanc-item-info">
                <div class="lanc-item-name">${t.description} ${badge}</div>
                <div class="lanc-item-sub">${t.categoryName || ''} · ${formatDate(t.date)}</div>
            </div>
            <div class="lanc-item-amount ${isExp ? 'expense' : 'income'}">
                ${isExp ? '-' : '+'}R$ ${Math.abs(t.amount).toFixed(2).replace('.',',')}
            </div>
            <div class="lanc-actions">
                <button onclick="openEditTransaction(${t.id})" title="Editar">Editar</button>
                <button onclick="deleteTransaction(${t.id})" title="Excluir">Excluir</button>
            </div>
        </div>`;
    }).join('');

    updateLancFooter(transactions);
}

function updateLancFooter(transactions) {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((a,t) => a+t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a,t) => a+t.amount, 0);
    const saldo = income - expense;
    setElText('f-saldo', saldo.toFixed(2).replace('.',','));
    setElText('f-previsto', saldo.toFixed(2).replace('.',','));
    document.querySelectorAll('#lanc-summary-expanded .val-green').forEach(el => el.textContent = income.toFixed(2).replace('.',','));
    document.querySelectorAll('#lanc-summary-expanded .val-red').forEach(el => el.textContent = expense.toFixed(2).replace('.',','));
    document.querySelectorAll('#lanc-summary-expanded .val-purple').forEach(el => el.textContent = saldo.toFixed(2).replace('.',','));
}

function toggleLancSummary() {
    const collapsed = document.getElementById('lanc-summary-collapsed');
    const expanded = document.getElementById('lanc-summary-expanded');
    const btn = document.getElementById('summary-toggle-btn');
    const isHidden = expanded.style.display === 'none' || !expanded.style.display;
    collapsed.style.display = isHidden ? 'none' : 'block';
    expanded.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? '−' : '+';
}

function clearLancFilters() {
    document.querySelectorAll('.lanc-filters input[type=checkbox]').forEach(cb => cb.checked = false);
    const search = document.getElementById('lanc-search-input');
    if (search) search.value = '';
    lancSearchTerm = '';
    renderLancamentos();
}

function toggleLancSearch() {
    const box = document.getElementById('lanc-search-box');
    const input = document.getElementById('lanc-search-input');
    if (!box || !input) return;
    const willOpen = box.style.display === 'none' || !box.style.display;
    box.style.display = willOpen ? 'block' : 'none';
    if (willOpen) {
        input.focus();
    } else {
        lancSearchTerm = '';
        input.value = '';
        renderLancamentos();
    }
}

function applyLancSearch() {
    const input = document.getElementById('lanc-search-input');
    lancSearchTerm = input ? input.value.trim() : '';
    renderLancamentos();
}

function toggleDropdown(id) {
    const dd = document.getElementById(id);
    const isOpen = dd.classList.contains('open');
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('open'));
    if (!isOpen) dd.classList.add('open');
}

function setupDropdownClose() {
    document.addEventListener('click', e => {
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('open'));
        }
    });
}

async function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/transactions/${id}`, { method:'DELETE' });
        if (res.ok) { await fetchAllTransactions(); renderLancamentos(); loadDashboard(); }
        else alert('Erro ao deletar');
    } catch { alert('Erro ao deletar'); }
}

// ===== RELATÓRIOS =====
async function loadRelatorios() {
    await fetchAllTransactions();
    const m = monthState.rel;
    const transactions = allTransactions.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });
    renderRelatoriosCategorias(transactions);
    renderRelatoriosEntSai(transactions, 'diario');
}

function renderRelatoriosCategorias(transactions) {
    const container = document.getElementById('rel-cat-content');
    if (!container) return;

    if (!transactions.length) {
        container.innerHTML = '<div class="page-empty-state"><div class="empty-icon-circle">!</div><p>Nenhum lançamento no período</p></div>';
        return;
    }

    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const incomes  = transactions.filter(t => t.type === 'INCOME');

    const groupBy = arr => {
        const map = {};
        arr.forEach(t => {
            const k = t.categoryName || 'Outros';
            if (!map[k]) map[k] = { icon: t.categoryIcon || '📦', total:0 };
            map[k].total += t.amount;
        });
        return Object.entries(map).map(([name, g]) => ({ name, ...g })).sort((a,b) => b.total - a.total);
    };

    const expGroups = groupBy(expenses);
    const incGroups = groupBy(incomes);
    const expTotal  = expGroups.reduce((a,g) => a+g.total, 0);
    const incTotal  = incGroups.reduce((a,g) => a+g.total, 0);
    const expColors = ['#EFB4B4','#494FDF','#f59e0b','#6262D3','#CF0404','#BEBEBE','#14A10C','#C1D8C0'];
    const incColors = ['#C1D8C0','#14A10C','#6262D3','#494FDF','#f59e0b'];

    const renderBlock = (groups, total, label, chartId, colors) => {
        if (!groups.length) return '';
        const items = groups.map(g => {
            const pct = total > 0 ? ((g.total/total)*100).toFixed(1) : '0.0';
            return `<div class="rel-item">
                <div class="rel-item-icon">${g.icon}</div>
                <div class="rel-item-name">${g.name}</div>
                <div class="rel-item-vals">
                    <span class="rel-item-amount">R$ ${g.total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                    <span class="rel-item-pct">${pct}%</span>
                </div>
            </div>`;
        }).join('');
        return `<div class="rel-block rel-view-${relViewMode}">
            <div class="rel-content">
                <div class="rel-list">
                    <p class="rel-section-label">${label}</p>
                    ${items}
                    <div class="rel-total"><span>Total</span><span>R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                </div>
                <div class="rel-chart">
                    <canvas id="${chartId}" width="160" height="160"></canvas>
                    <p class="rel-note">Gastos de cartão com base na data da compra</p>
                </div>
            </div>
        </div>`;
    };

    container.innerHTML =
        renderBlock(expGroups, expTotal, 'Despesas', 'rel-chart-exp', expColors) +
        (relFilterMode === 'all' && expGroups.length && incGroups.length ? '<hr class="rel-divider">' : '') +
        (relFilterMode === 'all' ? renderBlock(incGroups, incTotal, 'Receitas', 'rel-chart-inc', incColors) : '');

    setTimeout(() => {
        if (expGroups.length) {
            const ctx = document.getElementById('rel-chart-exp');
            if (ctx) { if(relChartExpense) relChartExpense.destroy(); relChartExpense = new Chart(ctx, { type:'doughnut', data:{ labels:expGroups.map(g=>g.name), datasets:[{ data:expGroups.map(g=>g.total), backgroundColor:expColors.slice(0,expGroups.length), borderWidth:0 }] }, options:{ cutout:'65%', plugins:{ legend:{display:false} } } }); }
        }
        if (incGroups.length) {
            const ctx = document.getElementById('rel-chart-inc');
            if (ctx) { if(relChartIncome) relChartIncome.destroy(); relChartIncome = new Chart(ctx, { type:'doughnut', data:{ labels:incGroups.map(g=>g.name), datasets:[{ data:incGroups.map(g=>g.total), backgroundColor:incColors.slice(0,incGroups.length), borderWidth:0 }] }, options:{ cutout:'65%', plugins:{ legend:{display:false} } } }); }
        }
    }, 50);
}

// ===== RELATÓRIOS ENTRADAS x SAÍDAS =====
let currentPeriod = 'diario';

function switchPeriod(period, btn) {
    document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPeriod = period;
    const m = monthState.rel;
    const transactions = allTransactions.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });
    renderRelatoriosEntSai(transactions, period);
}

function renderRelatoriosEntSai(transactions, period) {
    const container = document.getElementById('rel-ent-sai-content');
    if (!container) return;

    if (!transactions.length) {
        container.innerHTML = '<div class="page-empty-state"><div class="empty-icon-circle">!</div><p>Nenhum lançamento no período</p></div>';
        return;
    }

    // Group by period
    const groups = {};
    transactions.forEach(t => {
        const d = parseLocalDate(t.date);
        let key;
        if (period === 'diario') {
            key = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
        } else if (period === 'semanal') {
            const weekNum = Math.ceil(d.getDate() / 7);
            key = `Sem. ${weekNum}`;
        } else if (period === 'mensal') {
            key = MONTHS[d.getMonth()];
        } else { // acumulado
            key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        }
        if (!groups[key]) groups[key] = { income: 0, expense: 0 };
        if (t.type === 'INCOME') groups[key].income += t.amount;
        else groups[key].expense += t.amount;
    });

    const entries = Object.entries(groups);
    const maxVal = Math.max(...entries.map(([, g]) => Math.max(g.income, g.expense)), 1);

    const bars = entries.map(([label, g]) => {
        const incW = ((g.income / maxVal) * 100).toFixed(1);
        const expW = ((g.expense / maxVal) * 100).toFixed(1);
        return `<div class="ent-sai-row">
            <div class="ent-sai-label">${label}</div>
            <div style="flex:1;display:flex;flex-direction:column;gap:3px;">
                <div class="ent-sai-bar-wrap"><div class="ent-sai-bar income" style="width:${incW}%"></div></div>
                <div class="ent-sai-bar-wrap"><div class="ent-sai-bar expense" style="width:${expW}%"></div></div>
            </div>
            <div style="text-align:right;font-size:0.78rem;min-width:90px;">
                <div class="val-green">+R$ ${g.income.toFixed(2).replace('.',',')}</div>
                <div class="val-red">-R$ ${g.expense.toFixed(2).replace('.',',')}</div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="ent-sai-bars">${bars}</div>
        <div class="ent-sai-legend">
            <span><div class="dot" style="background:var(--green)"></div> Receitas</span>
            <span><div class="dot" style="background:var(--red)"></div> Despesas</span>
        </div>`;
}

// ===== PAGE TABS =====
function switchPageTab(section, tab, btn) {
    const sectionId = section === 'rel' ? 'relatorios' : 'limites';
    document.querySelectorAll(`#${sectionId}-section .page-tab`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll(`#${sectionId}-section .page-tab-content`).forEach(c => c.classList.remove('active'));
    document.getElementById(`${section}-${tab}`).classList.add('active');
    if (section === 'lim' && tab === 'entradas') renderIncomeLimits();
    if (section === 'lim' && tab === 'categorias') renderLimites();
}

function switchRelSub(sub, btn) {
    document.querySelectorAll('.rel-sub-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    relFilterMode = sub === 'filtros' ? 'expenses' : 'all';
    loadRelatorios();
}
function switchRelView(view, btn) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    relViewMode = view;
    loadRelatorios();
}

// ===== LIMITES =====
function renderActiveLimitTab() {
    const activeTab = document.querySelector('#limites-section .page-tab-content.active');
    if (activeTab && activeTab.id === 'lim-entradas') {
        renderIncomeLimits();
        return;
    }
    renderLimites();
}

async function renderLimites() {
    const container = document.getElementById('limites-list');
    if (!container) return;

    const m = monthState.lim;
    const monthKey = getMonthKey(m);
    await fetchLimitsForMonth(monthKey);
    const monthLimits = limits;

    if (!monthLimits.length) {
        container.innerHTML = `<div class="lim-empty">
            <p id="lim-empty-msg">Nenhum limite de gasto definido em ${MONTHS[m.getMonth()]} ${m.getFullYear()}</p>
            <button class="manage-btn" onclick="openLimitModal()">Definir limite de gastos</button>
        </div>`;
        return;
    }

    container.innerHTML = monthLimits.map(l => {
        const spent = Number(l.spent || 0);
        const amount = Number(l.amount || 0);
        const pct = Math.min(Number(l.percentage || 0), 100);
        const pctStr = pct.toFixed(1);
        const fillClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
        const statusColor = pct >= 100 ? 'var(--red)' : pct >= 75 ? '#f59e0b' : 'var(--green)';
        return `<div class="lim-item">
            <div class="lim-item-header">
                <div class="lim-item-name">${getCategoryEmoji(l.categoryKey)} ${escapeHtml(l.categoryName)}</div>
                <div class="lim-item-vals">${formatCurrency(spent)} / ${formatCurrency(amount)}</div>
            </div>
            <div class="lim-progress-bar"><div class="lim-progress-fill ${fillClass}" style="width:${pctStr}%"></div></div>
            <div style="display:flex;justify-content:space-between;margin-top:0.4rem;align-items:center;">
                <span style="font-size:0.78rem;color:${statusColor};font-weight:600;">${pctStr}% utilizado</span>
                <button onclick="removeLimit(${l.id})" style="background:none;border:none;cursor:pointer;font-size:0.78rem;color:#777;">x remover</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML += `<button class="add-limit-btn" onclick="openLimitModal()">+ Adicionar limite</button>`;
}

function getCurrentLimMonth() {
    return `${MONTHS[monthState.lim.getMonth()]} ${monthState.lim.getFullYear()}`;
}

function getCategoryEmoji(cat) {
    const map = {
        alimentacao:'🍽', assinaturas:'📱', bares:'🍺', casa:'🏠', compras:'🛍',
        dividas:'💳', educacao:'📚', familia:'👨‍👩‍👧', impostos:'🏛', investimentos:'📈',
        lazer:'🎮', mercado:'🛒', outros:'📦', pets:'🐾', viagem:'✈',
        salario:'⭐', 'salário':'⭐', emprestimos:'🏦', 'empréstimos':'🏦'
    };
    return map[cat] || '📦';
}

function openLimitModal() { 
    const limMonth = document.getElementById('lim-month');
    const m = monthState.lim;
    if (limMonth) limMonth.value = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
    populateLimitCategories();
    document.getElementById('limit-modal').style.display = 'flex'; 
}
function closeLimitModal() { document.getElementById('limit-modal').style.display = 'none'; }

function populateLimitCategories() {
    const select = document.getElementById('lim-category');
    if (!select || !categories.length) return;
    const expenseLike = categories.filter(c => normalizeText(c.name) !== 'salario');
    select.innerHTML = expenseLike.map(c => `<option value="${normalizeText(c.name).replace(/\s+/g, '-')}">${escapeHtml(`${c.icon || ''} ${c.name}`.trim())}</option>`).join('');
}

async function handleAddLimit(e) {
    e.preventDefault();
    const categorySelect = document.getElementById('lim-category');
    const categoryKey = categorySelect.value;
    const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text.replace(/^[^\wÀ-ÿ]+/, '').trim() || categoryKey;
    const amount = parseFloat(document.getElementById('lim-value').value);
    const month = document.getElementById('lim-month').value;
    if (!categoryKey || !amount || !month) return;

    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/limits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryKey, categoryName, amount, month })
        });
        if (!res.ok) throw await res.json();
        closeLimitModal();
        document.getElementById('limit-modal').querySelector('form').reset();
        await renderLimites();
        await fetchLimitsForMonth(getMonthKey(new Date()));
        renderLimitesCard();
        loadRelatorios();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel salvar o limite'));
    }
}

async function renderIncomeLimits() {
    const container = document.getElementById('lim-entradas-list');
    if (!container) return;

    const monthKey = getMonthKey(monthState.lim);
    await fetchIncomeLimitsForMonth(monthKey);

    if (!incomeLimits.length) {
        container.innerHTML = `<div class="lim-empty">
            <p>Nenhuma meta de entrada definida em ${MONTHS[monthState.lim.getMonth()]} ${monthState.lim.getFullYear()}</p>
        </div>`;
    } else {
        container.innerHTML = incomeLimits.map(l => {
            const spent = Number(l.spent || 0);
            const amount = Number(l.amount || 0);
            const pct = Math.min(Number(l.percentage || 0), 100);
            const fillClass = pct >= 100 ? '' : pct >= 75 ? 'warn' : '';
            return `<div class="lim-item">
                <div class="lim-item-header">
                    <div class="lim-item-name">${escapeHtml(l.categoryName)}</div>
                    <div class="lim-item-vals">${formatCurrency(spent)} / ${formatCurrency(amount)}</div>
                </div>
                <div class="lim-progress-bar"><div class="lim-progress-fill ${fillClass}" style="width:${pct.toFixed(1)}%"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:0.4rem;align-items:center;">
                    <span style="font-size:0.78rem;color:var(--green);font-weight:600;">${pct.toFixed(1)}% atingido</span>
                    <button onclick="removeLimit(${l.id}, 'INCOME')" style="background:none;border:none;cursor:pointer;font-size:0.78rem;color:#777;">x remover</button>
                </div>
            </div>`;
        }).join('');
    }
}

async function handleAddIncomeLimit(e) {
    e.preventDefault();
    const categoryName = document.getElementById('lim-income-name').value.trim();
    const amount = parseFloat(document.getElementById('lim-income-value').value);
    const month = document.getElementById('lim-income-month').value || getMonthKey(monthState.lim);
    if (!categoryName || !amount || !month) return;

    try {
        const categoryKey = normalizeText(categoryName).replace(/\s+/g, '-');
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/limits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryKey, categoryName, amount, month, limitType: 'INCOME' })
        });
        if (!res.ok) throw await res.json();
        e.target.reset();
        document.getElementById('lim-income-month').value = getMonthKey(monthState.lim);
        await renderIncomeLimits();
        loadRelatorios();
        loadDashboard();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel salvar a meta de entrada'));
    }
}

async function removeLimit(id, type = 'EXPENSE') {
    if (!confirm('Remover este limite?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/limits/${id}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json();
        if (type === 'INCOME') {
            await renderIncomeLimits();
        } else {
            await renderLimites();
            await fetchLimitsForMonth(getMonthKey(new Date()));
            renderLimitesCard();
        }
        loadRelatorios();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel remover o limite'));
    }
}

// ===== PROFILE MENU =====
function toggleProfileMenu() {
    const menu = document.getElementById('profile-dropdown');
    if (!menu) return;
    menu.classList.toggle('open');
}

function closeProfileMenu() {
    const menu = document.getElementById('profile-dropdown');
    if (menu) menu.classList.remove('open');
}

function openProfileModal() {
    closeProfileMenu();
    syncProfileForm();
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
}

function syncProfileForm() {
    if (!currentUser) return;
    setElText('profile-user-name', currentUser.name || 'Usuario');
    setElText('profile-user-email', currentUser.email || '');
    setElText('profile-user-name-modal', `${currentUser.name || 'Usuario'} - ${currentUser.email || ''}`);
    const name = document.getElementById('profile-name');
    const email = document.getElementById('profile-email');
    if (name) name.value = currentUser.name || '';
    if (email) email.value = currentUser.email || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    if (!name || !email) return;

    try {
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        currentUser = { ...currentUser, id: data.id, name: data.name, email: data.email };
        localStorage.setItem('user', JSON.stringify(currentUser));
        showApp();
        closeProfileModal();
    } catch(err) {
        alert('Erro: ' + (err.error || 'nao foi possivel atualizar o perfil'));
    }
}

function handleGlobalKeydown(e) {
    if (e.key !== 'Escape') return;
    closeProfileMenu();
    closeProfileModal();
    closeAccountsModal();
    closeCardsModal();
    closeQuickModal();
    closeLimitModal();
}

document.addEventListener('click', e => {
    if (!e.target.closest('.profile-menu')) closeProfileMenu();
});

// ===== UTILS =====
function formatCurrency(v) {
    if (!v) v = 0;
    return `R$ ${parseFloat(v).toFixed(2).replace('.',',')}`;
}
function formatDate(d) {
    const date = parseLocalDate(d);
    return date.toLocaleDateString('pt-BR');
}

function parseLocalDate(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(value);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
