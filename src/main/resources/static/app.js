const API_BASE_URL = 'http://localhost:8080/api';
let currentUser = null;
let allTransactions = [];
let gastosChartInstance = null;
let relChartExpense = null;
let relChartIncome = null;
let relEntSaiChart = null;
let limits = JSON.parse(localStorage.getItem('monify_limits') || '[]');

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
    if (key === 'lim') { updateLimEmptyMsg(); renderLimites(); }
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
            await fetchAllTransactions();
            loadDashboard();
        } else alert('Erro: ' + data.error);
    } catch { alert('Erro ao fazer login'); }
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
    localStorage.removeItem('user');
    document.getElementById('app-page').style.display = 'none';
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('auth-page').style.flexDirection = 'column';
}

function checkAuthStatus() {
    const u = localStorage.getItem('user');
    if (u) {
        currentUser = JSON.parse(u);
        showApp();
        fetchAllTransactions().then(() => loadDashboard());
    }
}

function showApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'block';
    const el = document.getElementById('greeting-name');
    if (el && currentUser) el.textContent = (currentUser.name || 'Usuário') + '!';
}

function switchTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab === 'login' ? 'login-form' : 'register-form').classList.add('active');
    document.querySelectorAll('.tab-btn')[tab === 'login' ? 0 : 1].classList.add('active');
}

// ===== FETCH TRANSACTIONS =====
async function fetchAllTransactions() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/transactions/user/${currentUser.id}`);
        allTransactions = await res.json();
        if (!Array.isArray(allTransactions)) allTransactions = [];
    } catch(e) { console.error(e); allTransactions = []; }
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
    if (section === 'limites') renderLimites();
}

// ===== DASHBOARD =====
async function loadDashboard() {
    if (!currentUser) return;
    await fetchAllTransactions();

    const now = new Date();
    const monthTx = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = monthTx.filter(t => t.type === 'INCOME').reduce((a,t) => a+t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'EXPENSE').reduce((a,t) => a+t.amount, 0);
    const balance = income - expense;

    setElText('balance-val', formatCurrency(balance));
    setElText('hero-income', formatCurrency(income));
    setElText('hero-expense', formatCurrency(expense));

    renderContasPagar();
    renderGastosCard();
    renderLimitesCard();
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
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
}

// ===== VISIBILITY TOGGLE (eye button) =====
function toggleVisibility(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const isHidden = el.classList.toggle('hidden');
    // Find the eye button that controls this element
    const eyeBtn = document.querySelector(`[onclick="toggleVisibility('${elId}')"]`);
    if (eyeBtn) eyeBtn.textContent = isHidden ? '🙈' : '👁';
}

// ===== CONTAS A PAGAR =====
function renderContasPagar() {
    const body = document.getElementById('pagar-body');
    if (!body) return;
    const today = new Date();
    today.setHours(0,0,0,0);

    const overdue = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
        d.setHours(0,0,0,0);
        return d < today;
    });

    const upcoming = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
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

// ===== MAIORES GASTOS CARD =====
function renderGastosCard() {
    const ctx = document.getElementById('gastosChart');
    const listEl = document.getElementById('gastos-list');
    if (!listEl) return;
    if (gastosChartInstance) { gastosChartInstance.destroy(); gastosChartInstance = null; }

    const now = new Date();
    const expenses = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
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
    const now = new Date();
    const expenses = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    body.innerHTML = limits.map(l => {
        const spent = expenses.filter(t => {
            const name = (t.categoryName||'').toLowerCase();
            return name.includes(l.category) || l.category.includes(name.split(' ')[0]);
        }).reduce((a,t) => a+t.amount, 0);
        const pct = Math.min(l.value > 0 ? (spent/l.value)*100 : 0, 100);
        const fillClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
        return `<div class="lim-item">
            <div class="lim-item-header">
                <div class="lim-item-name">${getCategoryEmoji(l.category)} ${l.category}</div>
                <div class="lim-item-vals">R$ ${spent.toFixed(2).replace('.',',')} / R$ ${parseFloat(l.value).toFixed(2).replace('.',',')}</div>
            </div>
            <div class="lim-progress-bar"><div class="lim-progress-fill ${fillClass}" style="width:${pct.toFixed(1)}%"></div></div>
        </div>`;
    }).join('');
}

// ===== QUICK ADD MODAL =====
function openQuickAdd(type) {
    const typeEl = document.getElementById('q-type');
    if (typeEl) typeEl.value = type;
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = type === 'EXPENSE' ? 'Nova Despesa' : 'Nova Receita';
    const dateEl = document.getElementById('q-date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    populateModalCategories();
    document.getElementById('quick-modal').style.display = 'flex';
}
function closeQuickModal() { document.getElementById('quick-modal').style.display = 'none'; }

function populateModalCategories() {
    const sel = document.getElementById('q-category');
    const type = document.getElementById('q-type').value;
    if (!sel) return;
    sel.innerHTML = '';
    const despesas = ['Alimentação','Assinaturas e serviços','Bares e restaurantes','Casa','Compras','Dívidas e empréstimos','Educação','Família e filhos','Impostos e taxas','Investimentos','Lazer e hobbies','Mercado','Outros','Pets','Viagem'];
    const receitas = ['Empréstimos','Investimentos','Outras receitas','Salário'];
    (type === 'INCOME' ? receitas : despesas).forEach(c => {
        const o = document.createElement('option');
        o.value = c.toLowerCase(); o.textContent = c; sel.appendChild(o);
    });
}

document.addEventListener('change', e => {
    if (e.target && e.target.id === 'q-type') populateModalCategories();
});

async function handleQuickAdd(e) {
    e.preventDefault();
    if (!currentUser) return;
    const type = document.getElementById('q-type').value;
    const amount = parseFloat(document.getElementById('q-amount').value);
    const description = document.getElementById('q-description').value;
    const date = document.getElementById('q-date').value;
    const categoryName = document.getElementById('q-category').options[document.getElementById('q-category').selectedIndex]?.text || '';
    try {
        const res = await fetch(`${API_BASE_URL}/transactions?userId=${currentUser.id}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ type, categoryId:1, amount, description, date, categoryName })
        });
        if (res.ok) {
            closeQuickModal();
            document.getElementById('quick-modal').querySelector('form').reset();
            await fetchAllTransactions();
            loadDashboard();
            loadLancamentos();
        } else { const err = await res.json(); alert('Erro: ' + err.error); }
    } catch { alert('Erro ao salvar'); }
}

function closeModalOutside(e) {
    if (e.target === e.currentTarget) { closeQuickModal(); closeLimitModal(); }
}

// ===== LANÇAMENTOS =====
function getFilteredTransactions() {
    const m = monthState.lanc;
    return allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
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

    const sorted = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
    list.innerHTML = sorted.map(t => {
        const isExp = t.type === 'EXPENSE';
        const d = new Date(t.date); d.setHours(0,0,0,0);
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
            <button onclick="deleteTransaction(${t.id})" style="background:none;border:none;cursor:pointer;font-size:1rem;color:#ccc;padding:0.25rem;" title="Excluir">🗑</button>
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
        const d = new Date(t.date);
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
        return `<div class="rel-block">
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
        (expGroups.length && incGroups.length ? '<hr class="rel-divider">' : '') +
        renderBlock(incGroups, incTotal, 'Receitas', 'rel-chart-inc', incColors);

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
        const d = new Date(t.date);
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
        const d = new Date(t.date);
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
}

function switchRelSub(sub, btn) {
    document.querySelectorAll('.rel-sub-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function switchRelView(view, btn) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ===== LIMITES =====
function renderLimites() {
    const container = document.getElementById('limites-list');
    if (!container) return;

    const m = monthState.lim;
    const monthKey = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`;
    const monthLimits = limits.filter(l => !l.month || l.month === monthKey);

    if (!monthLimits.length) {
        container.innerHTML = `<div class="lim-empty">
            <p id="lim-empty-msg">Nenhum limite de gasto definido em ${MONTHS[m.getMonth()]} ${m.getFullYear()}</p>
            <button class="manage-btn" onclick="openLimitModal()">Definir limite de gastos</button>
        </div>`;
        return;
    }

    const expenses = allTransactions.filter(t => {
        if (t.type !== 'EXPENSE') return false;
        const d = new Date(t.date);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });

    container.innerHTML = monthLimits.map((l, i) => {
        const spent = expenses.filter(t => {
            const name = (t.categoryName||'').toLowerCase();
            return name.includes(l.category) || l.category.includes(name.split(' ')[0]);
        }).reduce((a,t) => a+t.amount, 0);
        const pct = Math.min(l.value > 0 ? (spent/l.value)*100 : 0, 100);
        const pctStr = pct.toFixed(1);
        const fillClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
        const statusColor = pct >= 100 ? 'var(--red)' : pct >= 75 ? '#f59e0b' : 'var(--green)';
        const globalIdx = limits.indexOf(l);
        return `<div class="lim-item">
            <div class="lim-item-header">
                <div class="lim-item-name">${getCategoryEmoji(l.category)} ${l.category}</div>
                <div class="lim-item-vals">R$ ${spent.toFixed(2).replace('.',',')} / R$ ${parseFloat(l.value).toFixed(2).replace('.',',')}</div>
            </div>
            <div class="lim-progress-bar"><div class="lim-progress-fill ${fillClass}" style="width:${pctStr}%"></div></div>
            <div style="display:flex;justify-content:space-between;margin-top:0.4rem;align-items:center;">
                <span style="font-size:0.78rem;color:${statusColor};font-weight:600;">${pctStr}% utilizado</span>
                <button onclick="removeLimit(${globalIdx})" style="background:none;border:none;cursor:pointer;font-size:0.78rem;color:#bbb;">✕ remover</button>
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
    document.getElementById('limit-modal').style.display = 'flex'; 
}
function closeLimitModal() { document.getElementById('limit-modal').style.display = 'none'; }

function handleAddLimit(e) {
    e.preventDefault();
    const category = document.getElementById('lim-category').value;
    const value = parseFloat(document.getElementById('lim-value').value);
    const month = document.getElementById('lim-month').value;
    if (!category || !value) return;
    const existsIdx = limits.findIndex(l => l.category === category && l.month === month);
    if (existsIdx >= 0) limits[existsIdx].value = value;
    else limits.push({ category, value, month });
    localStorage.setItem('monify_limits', JSON.stringify(limits));
    closeLimitModal();
    document.getElementById('limit-modal').querySelector('form').reset();
    renderLimites();
    renderLimitesCard();
}

function removeLimit(i) {
    limits.splice(i, 1);
    localStorage.setItem('monify_limits', JSON.stringify(limits));
    renderLimites();
    renderLimitesCard();
}

// ===== UTILS =====
function formatCurrency(v) {
    if (!v) v = 0;
    return `R$ ${parseFloat(v).toFixed(2).replace('.',',')}`;
}
function formatDate(d) {
    const date = new Date(d);
    // Fix timezone offset issue
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
}