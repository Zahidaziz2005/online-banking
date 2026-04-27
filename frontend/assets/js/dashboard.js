/**
 * 1. مددگار فنکشنز (Utility Functions)
 */

// کرنسی کو $0.00 کی شکل میں فارمیٹ کرنے کے لیے
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// لاگ آؤٹ فنکشن
async function logout() {
    try {
        const response = await fetch('/online-banking/backend/logout.php');
        const result = await response.json();
        if (result.success) window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

/**
 * 2. ڈیٹا فیچنگ فنکشنز (Data Fetching)
 */

// ٹرانزیکشن ہسٹری لوڈ کریں
async function fetchTransactionHistory(userAccountNumber) {
    const tableBody = document.getElementById('transaction-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch('/online-banking/backend/fetch_transactions.php');
        const transactions = await response.json();

        tableBody.innerHTML = ''; 

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-text-secondary">No recent transactions found.</td></tr>';
            return;
        }

        transactions.forEach(txn => {
            // کریڈٹ یا ڈیبٹ کی منطق
            const isCredit = (txn.receiver_account === userAccountNumber) || (txn.type === 'deposit');
            const icon = isCredit ? 'account_balance_wallet' : 'payments';
            const amountClass = isCredit ? 'text-secondary' : 'text-primary';
            const amountSign = isCredit ? '+' : '-';

            const formattedDate = new Date(txn.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const row = `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <span class="material-symbols-outlined text-gray-600">${icon}</span>
                            </div>
                            <div>
                                <p class="font-title-sm text-primary">${txn.description || 'General Transaction'}</p>
                                <p class="font-body-sm text-text-secondary">Ref: #TXN-${txn.transaction_id}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 font-body-sm text-text-secondary">${txn.type.toUpperCase()}</td>
                    <td class="px-6 py-4 font-body-sm text-text-secondary">${formattedDate}</td>
                    <td class="px-6 py-4 font-title-sm ${amountClass} text-right">
                        ${amountSign}${formatCurrency(txn.amount)}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                            Completed
                        </span>
                    </td>
                </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-red-500">Failed to load transactions.</td></tr>';
    }
}

// ڈیش بورڈ سمری (Earnings/Expenses) لوڈ کریں
async function loadDashboardSummary() {
    try {
        const response = await fetch('/online-banking/backend/get_dashboard_summary.php');
        const result = await response.json();

        if (result.success) {
            const { earnings, expenses } = result.data;

            document.getElementById('monthly-earnings').innerText = formatCurrency(earnings.total);
            document.getElementById('earning-percentage').innerText = `+${earnings.percentage}%`;

            document.getElementById('monthly-expenses').innerText = formatCurrency(expenses.total);
            document.getElementById('expense-percentage').innerText = `-${expenses.percentage}%`;
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

/**
 * 3. مین کنٹرولر (Main Initialization)
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/online-banking/backend/get_user_data.php');
        const result = await response.json();

        if (result.success) {
            const { full_name, balance, account_number } = result.data;

            // UI اپڈیٹس
            document.getElementById('user-name-side').innerText = full_name;
            document.getElementById('welcome-msg').innerText = `Good Morning, ${full_name.split(' ')[0]}`;
            document.getElementById('user-balance').innerText = formatCurrency(balance);
            document.getElementById('user-account').innerText = `•••• •••• •••• ${account_number.slice(-4)}`;

            // بقیہ ڈیٹا لوڈ کریں
            fetchTransactionHistory(account_number);
            loadDashboardSummary();

        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = 'login.html';
    }
});