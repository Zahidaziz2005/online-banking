import api from '../core/api.js';

// 1. گلوبل اسٹیٹ (سب سے اوپر رکھیں)
const userData = JSON.parse(localStorage.getItem('user_data'));
let allTransactions = []; 

/**
 * پیج لوڈ ہونے پر ایونٹ لسنر
 */
document.addEventListener('DOMContentLoaded', async () => {
    if (!userData) {
        window.location.href = 'login.html'; // سیشن نہ ہونے پر ری ڈائریکٹ کریں
        return;
    }
    
    updateHeader();
    await loadTransactionData();
    setupEventListeners();
});

/**
 * ہیڈر میں یوزر کا نام اپ ڈیٹ کرنا
 */
function updateHeader() {
    const userDisplayNameEl = document.getElementById('user-display-name');
    if (userDisplayNameEl && userData.full_name) {
        const firstName = userData.full_name.split(' ')[0];
        userDisplayNameEl.textContent = `Welcome, ${firstName}`;
    }
}

/**
 * بیک اینڈ سے ٹرانزیکشن ڈیٹا حاصل کرنا
 */
async function loadTransactionData() {
    try {
        const response = await api.get(`../backend/user/history.php?user_id=${userData.user_id}`);

        if (response.success) {
            allTransactions = response.data;
            updateSummaryCards(response.income, response.expense);
            renderTable(allTransactions);
        }
    } catch (error) {
        console.error("Failed to load transactions:", error);
    }
}

/**
 * سمری کارڈز (Balance, Inflow, Outflow) کو اپ ڈیٹ کرنا
 */
function updateSummaryCards(income, expense) {
    const els = {
        balance: document.getElementById('total_balance'),
        inflow: document.getElementById('monthly_inflow'),
        outflow: document.getElementById('monthly_outflow'),
        inflowCount: document.getElementById('inflow_count'),
        outflowCount: document.getElementById('outflow_count')
    };

    const formatCurrency = (val) => 
        `PKR ${parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (els.balance) els.balance.textContent = formatCurrency(userData.balance);
    if (els.inflow) els.inflow.textContent = formatCurrency(income);
    if (els.outflow) els.outflow.textContent = formatCurrency(expense);

    const inCount = allTransactions.filter(t => !t.is_debit).length;
    const outCount = allTransactions.filter(t => t.is_debit).length;

    if (els.inflowCount) els.inflowCount.textContent = `${inCount} successful deposits`;
    if (els.outflowCount) els.outflowCount.textContent = `${outCount} transfers & payments`;
}

/**
 * تمام ایونٹ لسنرز (Filters, Search, Download)
 */
function setupEventListeners() {
    const applyBtn = document.getElementById('apply_filters_btn');
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const downloadBtn = document.getElementById('download_btn');

    // فلٹرز کا اطلاق
    applyBtn?.addEventListener('click', () => {
        const type = document.getElementById('filter_type').value;
        const status = document.getElementById('filter_status').value;
        const days = document.getElementById('filter_date').value;

        let filtered = allTransactions;

        if (type !== 'all') filtered = filtered.filter(t => t.display_type === type);
        if (status !== 'all') filtered = filtered.filter(t => t.status.toLowerCase() === status.toLowerCase());
        
        if (days !== 'all') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(days));
            filtered = filtered.filter(t => new Date(t.created_at) >= cutoff);
        }
        renderTable(filtered);
    });

    // لائیو سرچ لاجک
    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allTransactions.filter(t => 
            t.transaction_id.toLowerCase().includes(term) || 
            (t.description && t.description.toLowerCase().includes(term))
        );
        renderTable(filtered);
    });

    // پی ڈی ایف اسٹیٹمنٹ ڈاؤن لوڈ
    downloadBtn?.addEventListener('click', () => {
        const params = new URLSearchParams({ user_id: userData.user_id });
        window.location.href = `../backend/user/generate_statement.php?${params.toString()}`;
    });
}

/**
 * ٹیبل کو رینڈر کرنا
 */
function renderTable(data) {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-md text-center opacity-50">No transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(txn => renderRow(txn)).join('');
}

/**
 * ٹیبل رو (Row) کا اسٹرکچر
 */
function renderRow(txn) {
    const isDebit = txn.is_debit;
    const statusConfig = {
        'completed': 'bg-emerald-100 text-emerald-800',
        'pending': 'bg-amber-100 text-amber-800',
        'failed': 'bg-red-100 text-red-800'
    };
    const statusClass = statusConfig[txn.status.toLowerCase()] || 'bg-gray-100';
    
    const dateFormatted = new Date(txn.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    return `
    <tr class="hover:bg-surface-container-low transition-colors border-b border-outline-variant">
        <td class="px-md py-4 text-on-surface">${dateFormatted}</td>
        <td class="px-md py-4">
            <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span class="material-symbols-outlined text-lg">${txn.icon || 'payments'}</span>
                </div>
                <div class="flex flex-col">
                    <span class="font-medium text-on-surface">${txn.description || 'Transaction'}</span>
                    <span class="text-[11px] text-on-surface-variant uppercase font-bold">${txn.display_type}</span>
                </div>
            </div>
        </td>
        <td class="px-md py-4 font-mono text-xs text-on-surface-variant">${txn.transaction_id}</td>
        <td class="px-md py-4 text-right ${isDebit ? 'text-error' : 'text-emerald-600'} font-semibold">
            ${isDebit ? '-' : '+'}PKR ${parseFloat(txn.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </td>
        <td class="px-md py-4">
            <span class="px-3 py-1 ${statusClass} rounded-full text-[10px] font-bold uppercase tracking-wider">${txn.status}</span>
        </td>
        <td class="px-md py-4 text-center">
            <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <span class="material-symbols-outlined">more_vert</span>
            </button>
        </td>
    </tr>`;
}