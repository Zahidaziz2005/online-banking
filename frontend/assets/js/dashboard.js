/**
 * 1. مددگار فنکشنز (Utility Functions)
 */

// کرنسی فارمیٹ (USD یا PKR کے لیے)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// لاگ آؤٹ فنکشن
async function logout() {
    try {
        // پاتھ کو درست کیا گیا ہے
        const response = await fetch('../backend/logout.php');
        const result = await response.json();
        if (result.success) window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

/**
 * 2. اسٹیٹمنٹ کنٹرولرز
 */
function toggleStatementDropdown() {
    const dropdown = document.getElementById('statement-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function downloadPDF() {
    const startDate = document.getElementById('stmt-start').value;
    const endDate = document.getElementById('stmt-end').value;

    if (!startDate || !endDate) {
        alert("براہ کرم تاریخ منتخب کریں۔");
        return;
    }
    // پاتھ پہلے ہی درست تھا
    window.location.href = `../backend/generate_pdf.php?start=${startDate}&end=${endDate}`;
}

/**
 * 3. ڈیٹا فیچنگ فنکشنز
 */
async function fetchTransactionHistory(userAccountNumber) {
    const tableBody = document.getElementById('transaction-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch('../backend/fetch_transactions.php');
        const transactions = await response.json();

        tableBody.innerHTML = ''; 

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-text-secondary">کوئی ٹرانزیکشن نہیں ملی۔</td></tr>';
            return;
        }

        transactions.forEach(txn => {
            // ڈیٹا بیس کی فیلڈز کے مطابق چیک (sender_account اور receiver_account)
            const isCredit = (txn.receiver_account == userAccountNumber);
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
                                <p class="font-title-sm text-primary">${txn.description || 'Transfer'}</p>
                                <p class="font-body-sm text-text-secondary">ID: #TXN-${txn.transaction_id}</p>
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
        console.error('Fetch error:', error);
    }
}

async function loadDashboardSummary() {
    try {
        const response = await fetch('../backend/get_dashboard_summary.php');
        const result = await response.json();

        if (result.success) {
            const { earnings, expenses } = result.data;
            if(document.getElementById('monthly-earnings')) {
                document.getElementById('monthly-earnings').innerText = formatCurrency(earnings.total);
                document.getElementById('earning-percentage').innerText = `+${earnings.percentage}%`;
                document.getElementById('monthly-expenses').innerText = formatCurrency(expenses.total);
                document.getElementById('expense-percentage').innerText = `-${expenses.percentage}%`;
            }
        }
    } catch (error) {
        console.error('Summary loading error:', error);
    }
}

/**
/**
 * 4. Initialization (درست شدہ ورژن)
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../backend/get_user_data.php');
        const result = await response.json();

        if (result.success) {
            const { full_name, balance, account_number } = result.data;

            // UI اپڈیٹس
            if(document.getElementById('user-name-side')) 
                document.getElementById('user-name-side').innerText = full_name;
            
            if(document.getElementById('welcome-msg')) 
                document.getElementById('welcome-msg').innerText = `Well Come, ${full_name.split(' ')[0]}`;
            
            if(document.getElementById('user-balance')) 
                document.getElementById('user-balance').innerText = formatCurrency(balance);
            
            if(document.getElementById('user-account')) 
                document.getElementById('user-account').innerText = `•••• •••• •••• ${account_number.slice(-4)}`;

            // ٹرانزیکشنز اور سمری لوڈ کریں
            fetchTransactionHistory(account_number);
            loadDashboardSummary();

        } else {
            // اگر سیشن نہیں ہے تو وجہ کنسول میں پرنٹ کریں
            console.warn('Session missing or error:', result.message);
            window.location.href = 'login.html';
        }
    } catch (error) {
        // نیٹ ورک یا سرور ایرر کی صورت میں تفصیل دکھائیں
        console.error('Initialization error details:', error);
        window.location.href = 'login.html';
    }
});