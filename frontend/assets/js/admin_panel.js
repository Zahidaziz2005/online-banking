// frontend/assets/js/admin_panel.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. سب سے پہلے سیشن چیک کریں
    await checkSession();

    // 2. ڈیش بورڈ کے اعداد و شمار لوڈ کریں
    await loadDashboardStats();

    // 3. یوزرز کی لسٹ لوڈ کریں
    await loadUserDirectory();

    // 4. لاگ آؤٹ ہینڈلر کو فعال کریں
    setupLogout();
});

// سیشن چیک کرنے اور نام دکھانے کا فنکشن
async function checkSession() {
    try {
        const response = await fetch('../backend/get_staff_session.php');
        const data = await response.json();

        if (data.success) {
            const nameElements = document.querySelectorAll('.admin-name, #staff-display-name');
            nameElements.forEach(el => {
                el.textContent = data.name;
            });
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Session fetch error:", error);
    }
}

// ڈیش بورڈ کارڈز کو اپ ڈیٹ کرنے کا فنکشن
async function loadDashboardStats() {
    try {
        const response = await fetch('../backend/get_dashboard_stats.php');
        const stats = await response.json();

        if (document.getElementById('total-users-count')) {
            document.getElementById('total-users-count').textContent = stats.total_users;
            document.getElementById('active-users-count').textContent = stats.active_users;
            document.getElementById('frozen-users-count').textContent = stats.frozen_users;
        }
    } catch (error) {
        console.error("Stats load error:", error);
    }
}

// یوزرز کا ڈیٹا لوڈ کرنے اور ٹیبل بنانے کا فنکشن
async function loadUserDirectory() {
    try {
        const response = await fetch('../backend/get_all_users.php');
        const users = await response.json();
        const tableBody = document.getElementById('user-table-body');
        
        if (!tableBody) return;
        tableBody.innerHTML = ''; 

        users.forEach(user => {
            const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            
            const statusClass = user.is_frozen == 1 
                ? 'bg-error-container text-on-error-container' 
                : 'bg-secondary-container text-on-secondary-container';
            const statusText = user.is_frozen == 1 ? 'Frozen' : 'Active';

            const row = `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                ${initials}
                            </div>
                            <div>
                                <p class="font-title-sm text-text-primary">${user.full_name}</p>
                                <p class="text-[12px] text-text-secondary">${user.email}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-5 font-mono text-sm text-text-secondary">${user.account_number || 'N/A'}</td>
                    <td class="px-8 py-5 font-manrope font-bold text-primary">$${parseFloat(user.balance).toLocaleString()}</td>
                    <td class="px-8 py-5">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="flex items-center justify-end gap-4">
                            <button class="text-indigo-900 hover:text-primary-container font-semibold text-sm transition-colors">View Details</button>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" ${user.is_frozen == 0 ? 'checked' : ''} onchange="toggleUserStatus(${user.user_id}, this.checked)">
                                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("User directory load error:", error);
    }
}

// اکاؤنٹ فریز/ان فریز کرنے کا فنکشن
async function toggleUserStatus(userId, isChecked) {
    const isFrozen = isChecked ? 0 : 1; // Checkbox checked means NOT frozen
    try {
        const response = await fetch('../backend/update_user_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_frozen: isFrozen })
        });
        const data = await response.json();
        if (data.success) {
            // کارڈز اور ٹیبل کو دوبارہ تازہ کریں
            loadDashboardStats();
            loadUserDirectory();
        }
    } catch (error) {
        console.error("Update status error:", error);
    }
}

// لاگ آؤٹ بٹن کی سیٹنگ
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('../backend/logout.php');
                const data = await response.json();
                if (data.success) {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
}