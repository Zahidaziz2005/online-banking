document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("transactionTableBody");
    const searchInput = document.getElementById("txTableSearch");
    const globalSearch = document.getElementById("txSearchInput");
    const statusFilter = document.getElementById("txStatusFilter");
    const refreshBtn = document.getElementById("btnRefreshTx");
    const counterText = document.getElementById("txCounterText");

    // KPI Elements
    const statTotalVolume = document.getElementById("statTotalVolume");
    const statPendingCount = document.getElementById("statPendingCount");
    const statSuccessRate = document.getElementById("statSuccessRate");
    const statFlaggedCount = document.getElementById("statFlaggedCount");

    let allTransactions = [];

    // 1. بیک اینڈ سے ڈیٹا لوڈ کرنا
    async function fetchTransactions() {
        try {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-secondary">Loading financial records...</td></tr>`;
            }

            // فرض کریں آپ کے بیک اینڈ یو آر ایل کا نام 'get_transactions.php' ہے
            const response = await fetch("../backend/user/get_transactions.php");
            const data = await response.json();

            if (!data.success) {
                showError(data.error || "Failed to fetch transactions.");
                return;
            }

            allTransactions = data.transactions || [];
            
            // KPI کارڈز کو لائیو اپ ڈیٹ کرنا
            updateKPICards(data.stats);
            
            // ٹیبل رینڈر کرنا
            renderTable(allTransactions);

        } catch (error) {
            showError("Server communication breakdown.");
            console.error(error);
        }
    }

    // 2. خوبصورت لائیو کارڈز کیلکولیشن
    function updateKPICards(stats) {
        if (stats) {
            if (statTotalVolume) statTotalVolume.textContent = "$" + stats.total_volume.toLocaleString();
            if (statPendingCount) statPendingCount.textContent = stats.pending_count;
            if (statFlaggedCount) statFlaggedCount.textContent = stats.failed_count;
            if (statSuccessRate) statSuccessRate.textContent = stats.success_rate + "%";
        }
    }

    // 3. لائیو ٹیبل رینڈرنگ پلس فنانشل فارمیٹنگ
    function renderTable(transactions) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (transactions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-secondary">No transactional records found.</td></tr>`;
            if (counterText) counterText.textContent = "Showing 0 of 0 transactions";
            return;
        }

        transactions.forEach(tx => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-surface-container-low transition-colors group";

            // تاریخ فارمیٹ کرنا
            const txDate = new Date(tx.created_at);
            const formattedDate = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // اسٹیٹس بیج کے رنگ کا انتخاب (بیک اینڈ کی فیلڈ 'status' کے مطابق)
            let statusHTML = '';
            if (tx.status === 'completed' || tx.status === 'success') {
                statusHTML = `<div class="flex items-center gap-1.5 text-green-600"><span class="w-2 h-2 rounded-full bg-green-600"></span><span class="text-body-md font-medium">Success</span></div>`;
            } else if (tx.status === 'pending') {
                statusHTML = `<div class="flex items-center gap-1.5 text-amber-500"><span class="w-2 h-2 rounded-full bg-amber-500"></span><span class="text-body-md font-medium">Pending</span></div>`;
            } else {
                statusHTML = `<div class="flex items-center gap-1.5 text-red-600"><span class="w-2 h-2 rounded-full bg-red-600"></span><span class="text-body-md font-medium">Failed</span></div>`;
            }

            // رقم کا رنگ (اگر ٹرانسفر ہے تو نارمل، اگر ڈپازٹ ہے تو سبز)
            const amountColor = (tx.txn_type === 'deposit') ? 'text-green-600' : 'text-primary';
            const amountPrefix = (tx.txn_type === 'deposit') ? '+' : '-';

            tr.innerHTML = `
                <td class="px-6 py-5 whitespace-nowrap">
                    <div class="text-body-md font-medium text-primary">${formattedDate}</div>
                    <div class="text-[11px] text-on-surface-variant">${formattedTime}</div>
                </td>
                <td class="px-6 py-5 whitespace-nowrap font-mono text-xs text-on-surface-variant">TXN-${tx.transaction_id || tx.reference_no}</td>
                <td class="px-6 py-5 whitespace-nowrap font-medium text-primary">A/C: ${tx.sender_account_id || 'External'}</td>
                <td class="px-6 py-5 whitespace-nowrap font-medium text-primary">A/C: ${tx.receiver_account_id}</td>
                <td class="px-6 py-5 whitespace-nowrap">
                    <span class="px-2 py-1 rounded bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-tight">${tx.txn_type}</span>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-right">
                    <div class="text-body-md font-bold ${amountColor}">${amountPrefix}$${parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </td>
                <td class="px-6 py-5 whitespace-nowrap">${statusHTML}</td>
            `;
            tableBody.appendChild(tr);
        });

        if (counterText) {
            counterText.textContent = `Showing 1-${transactions.length} of ${transactions.length} institutional logs`;
        }
    }

    // 4. سرچ اور فلٹرز کی کمبائنڈ لاجک
    function filterTransactions() {
        const searchValue = (searchInput?.value || globalSearch?.value || "").toLowerCase();
        const selectedStatus = statusFilter?.value || "all";

        const filtered = allTransactions.filter(tx => {
            const matchesSearch = 
                (tx.transaction_id && tx.transaction_id.toString().includes(searchValue)) ||
                (tx.sender_account_id && tx.sender_account_id.toString().includes(searchValue)) ||
                (tx.receiver_account_id && tx.receiver_account_id.toString().includes(searchValue)) ||
                (tx.description && tx.description.toLowerCase().includes(searchValue));

            const matchesStatus = (selectedStatus === "all") || (tx.status === selectedStatus);

            return matchesSearch && matchesStatus;
        });

        renderTable(filtered);
    }

    // ایونٹ لسنرز لنک کرنا
    if (searchInput) searchInput.addEventListener("input", filterTransactions);
    if (globalSearch) globalSearch.addEventListener("input", filterTransactions);
    if (statusFilter) statusFilter.addEventListener("change", filterTransactions);
    if (refreshBtn) refreshBtn.addEventListener("click", fetchTransactions);

    function showError(msg) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-error font-medium">${msg}</td></tr>`;
        }
    }

    // پہلی بار پیج لوڈ ہونے پر ڈیٹا چلائیں
    fetchTransactions();
});