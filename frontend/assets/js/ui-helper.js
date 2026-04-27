/**
 * UI HELPER UTILITIES
 * These functions manage the visibility and content of shared UI components.
 */

/**
 * Toggles the full-screen loading overlay
 * @param {boolean} show - True to show, false to hide
 * @param {string} title - Optional custom title
 */
function toggleLoading(show, title = "Processing Transaction...") {
    const overlay = document.getElementById('overlay-loading');
    const titleEl = document.getElementById('loading-title');
    
    if (!overlay) return;

    if (show) {
        if (titleEl) titleEl.innerText = title;
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

/**
 * Updates and displays the Success Modal
 * @param {string} name - Recipient name
 * @param {string|number} amount - Amount transferred
 */
function showSuccessModal(name, amount) {
    const modal = document.getElementById('modal-success');
    const nameEl = document.getElementById('display-recipient');
    const amountEl = document.getElementById('display-amount');

    if (!modal) return;

    if (nameEl) nameEl.innerText = name;
    if (amountEl) amountEl.innerText = '$' + amount;
    
    modal.classList.remove('hidden');
}

/**
 * Hides Success Modal and redirects to Dashboard
 */
function closeSuccessModal() {
    const modal = document.getElementById('modal-success');
    if (modal) modal.classList.add('hidden');
    window.location.href = 'dashboard.html';
}

/**
 * Displays an error toast with auto-hide logic
 * @param {string} title - Main error heading
 * @param {string} message - Error details
 */
function showErrorToast(title, message) {
    const toast = document.getElementById('toast-error');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');

    if (!toast) return;

    if (titleEl) titleEl.innerText = title;
    if (messageEl) messageEl.innerText = message;
    
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(closeToast, 5000);
}

/**
 * Manually hides the error toast
 */
function closeToast() {
    const toast = document.getElementById('toast-error');
    if (toast) toast.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // James کا ڈیٹا حاصل کرنے کے لیے بیک اینڈ کال
        const response = await fetch('/online-banking/backend/get_user_data.php');
        const result = await response.json();

        if (result.success) {
            // James کا نام اور اکاؤنٹ اپڈیٹ کریں
            document.getElementById('user-name').innerText = result.data.full_name;
            
            const accNum = result.data.account_number;
            document.getElementById('user-account').innerText = `**** **** **** ${accNum.slice(-4)}`;
            
            document.getElementById('user-balance').innerText = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(result.data.balance);
        } else {
            // اگر سیشن نہ ملے تو لاگ ان پر بھیج دیں
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error:', error);
    }
});