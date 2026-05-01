/**
 * UI HELPER UTILITIES
 * صرف موڈلز، ٹوسٹ اور لوڈنگ اسکرین کو کنٹرول کرنے کے لیے
 */

// 1. لوڈنگ اوورلے کو کنٹرول کریں
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

// 2. کامیابی کا موڈل دکھائیں
function showSuccessModal(name, amount) {
    const modal = document.getElementById('modal-success');
    const nameEl = document.getElementById('display-recipient');
    const amountEl = document.getElementById('display-amount');

    if (!modal) return;

    if (nameEl) nameEl.innerText = name;
    // پاکستانی روپوں کے لیے آپ یہاں RS لکھ سکتے ہیں
    if (amountEl) amountEl.innerText = '$' + amount; 
    
    modal.classList.remove('hidden');
}

function closeSuccessModal() {
    const modal = document.getElementById('modal-success');
    if (modal) modal.classList.add('hidden');
    window.location.href = 'dashboard.html';
}

// 3. ایرر میسج دکھانے کے لیے
function showErrorToast(title, message) {
    const toast = document.getElementById('toast-error');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');

    if (!toast) return;

    if (titleEl) titleEl.innerText = title;
    if (messageEl) messageEl.innerText = message;
    
    toast.classList.remove('hidden');
    setTimeout(closeToast, 5000);
}

function closeToast() {
    const toast = document.getElementById('toast-error');
    if (toast) toast.classList.add('hidden');
}

// نوٹ: ڈیٹا فیچ کرنے والا 'DOMContentLoaded' والا حصہ یہاں سے ختم کر دیا گیا ہے۔
// وہ کام صرف dashboard.js کو کرنا چاہیے۔