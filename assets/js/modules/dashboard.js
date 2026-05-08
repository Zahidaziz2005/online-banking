/**
 * Dashboard.js - Apex Banking Dashboard Logic
 * Optimized for Performance & Security
 */

import api from '../core/api.js';

// 1. گلوبل ڈیٹا لوڈ کریں
const userData = JSON.parse(localStorage.getItem('user_data'));
const token = localStorage.getItem('auth_token');

/**
 * پیج لوڈ ہونے پر مین انیشلائزیشن
 */
document.addEventListener('DOMContentLoaded', async () => {
    // سیکیورٹی چیک
    if (!token || !userData) {
        window.location.replace('../login.html');
        return;
    }

    // UI کو فوری طور پر موجودہ ڈیٹا سے بھریں
    initUI(userData);

    // ایونٹ لسنرز سیٹ کریں (بشمول لاگ آؤٹ)
    setupEventListeners();

    // سرور سے تازہ ترین ڈیٹا حاصل کریں
    await Promise.all([
        refreshDashboardData(),
        updateStats()
    ]);
});

/**
 * یوزر کا بنیادی ڈیٹا اسکرین پر دکھانا
 */
function initUI(user) {
    const balanceField = document.querySelector('[data-field="balance"]');
    const accField = document.querySelector('[data-field="account_number"]');
    const nameField = document.getElementById('user-display-name') || document.getElementById('user-name');

    // بیلنس اپ ڈیٹ (PKR فارمیٹ)
    if (balanceField && user.balance !== undefined) {
        balanceField.textContent = `PKR ${parseFloat(user.balance).toLocaleString('en-US', { 
            minimumFractionDigits: 2 
        })}`;
    }

    // اکاؤنٹ نمبر کے آخری 4 ہندسے دکھانا
    const accNo = user.account_number || user.account_no;
    if (accField && accNo) {
        const lastFour = accNo.toString().slice(-4);
        accField.textContent = `**** **** ${lastFour}`;
    }
    
    // خوش آمدید کا پیغام
    if (nameField && user.full_name) {
        const firstName = user.full_name.split(' ')[0];
        nameField.textContent = `Welcome, ${firstName}`;
    }
}

/**
 * تمام ایونٹ لسنرز (لاگ آؤٹ وغیرہ)
 */
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                handleLogout();
            }
        });
    }
}

/**
 * لاگ آؤٹ فنکشن: سیشن ختم کر کے لاگ ان پیج پر بھیجے گا
 */
function handleLogout() {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    
    // Replace استعمال کریں تاکہ یوزر 'Back' بٹن سے واپس نہ آ سکے
    window.location.replace('index.html'); 
}

/**
 * سرور سے تازہ بیلنس اور اکاؤنٹ اسٹیٹس منگوانا
 */
async function refreshDashboardData() {
    if (!userData?.user_id) return;

    try {
        const response = await api.get(`../backend/user/dashboard.php?user_id=${userData.user_id}`);
        
        if (response.success) {
            // UI اور LocalStorage دونوں کو تازہ ڈیٹا سے اپ ڈیٹ کریں
            const updatedUser = { ...userData, ...response.user };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            initUI(updatedUser);
        }
    } catch (error) {
        console.error("Dashboard Sync Error:", error);
    }
}

/**
 * ماہانہ انکم اور ایکسپینس کے اعداد و شمار
 */
async function updateStats() {
    const incomeEl = document.getElementById('monthly_income');
    const expenseEl = document.getElementById('monthly_expenses');

    if (!incomeEl || !expenseEl || !userData?.user_id) return;

    try {
        const response = await api.get(`../backend/user/history.php?user_id=${userData.user_id}`);
        
        if (response.success) {
            const format = (val) => `PKR ${parseFloat(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
            
            incomeEl.textContent = format(response.income);
            expenseEl.textContent = format(response.expense);
        }
    } catch (error) {
        console.error("Stats Update Error:", error);
    }
}