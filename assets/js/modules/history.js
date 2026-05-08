import api from '../core/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const historyTableBody = document.getElementById('history_table_body');
    const incomeEl = document.getElementById('monthly_income');
    const expenseEl = document.getElementById('monthly_expenses');
    const userData = JSON.parse(localStorage.getItem('user_data'));

    if (!userData) return;

    try {
        // API سے ڈیٹا منگوائیں
        const response = await api.get(`../backend/user/history.php?user_id=${userData.user_id}`);

        if (response.success) {
            // --- 1. کارڈز اپ ڈیٹ کریں (Income & Expenses) ---
            if (incomeEl) {
                incomeEl.textContent = `$${parseFloat(response.income).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            }
            if (expenseEl) {
                expenseEl.textContent = `$${parseFloat(response.expense).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            }

            // --- 2. ٹیبل اپ ڈیٹ کریں ---
            if (historyTableBody) {
                const transactions = response.data;
                let html = '';

                if (transactions.length === 0) {
                    html = `<tr><td colspan="5" class="px-gutter py-md text-center text-outline">کوئی ٹرانزیکشن نہیں ملی۔</td></tr>`;
                } else {
                    transactions.forEach(txn => {
                        const isDebit = txn.sender_acc === userData.account_number;
                        const colorClass = isDebit ? 'text-error' : 'text-emerald-600';
                        const amountPrefix = isDebit ? '-' : '+';
                        const icon = isDebit ? 'payments' : 'savings';
                        const statusClass = txn.status === 'completed' 
                            ? 'text-emerald-600 bg-emerald-50' 
                            : 'text-amber-600 bg-amber-50';

                        html += `
                            <tr class="hover:bg-surface-container-low transition-colors">
                                <td class="px-gutter py-md">
                                    <div class="flex items-center gap-sm">
                                        <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                                            <span class="material-symbols-outlined text-sm">${icon}</span>
                                        </div>
                                        <div>
                                            <p class="font-body-md text-body-md font-semibold">${txn.description}</p>
                                            <p class="text-body-xs text-outline">${isDebit ? 'To: ' + txn.receiver_acc : 'From: ' + txn.sender_acc}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-gutter py-md text-body-sm text-secondary">
                                    ${new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td class="px-gutter py-md text-right font-body-md text-body-md font-bold ${colorClass}">
                                    ${amountPrefix}$${parseFloat(txn.amount).toLocaleString()}
                                </td>
                                <td class="px-gutter py-md">
                                    <span class="font-label-caps text-label-caps ${statusClass} px-sm py-1 rounded">
                                        ${txn.status.toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-gutter py-md text-right">
                                    <span class="material-symbols-outlined text-outline cursor-pointer">more_vert</span>
                                </td>
                            </tr>`;
                    });
                }
                historyTableBody.innerHTML = html;
            }
        }
    } catch (error) {
        console.error("Load Error:", error);
    }
});