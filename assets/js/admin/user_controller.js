document.addEventListener("DOMContentLoaded", () => {
    let allUsers = [];
    const tableBody = document.getElementById("userTableBody");
    const searchInput = document.getElementById("userSearchInput");

    // 1. ڈیٹا بیس سے یوزرز لانے کا مین فنکشن
    async function fetchUsers() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-secondary">Loading institutional users...</td></tr>`;
            
            const response = await fetch("../backend/user/get_user.php"); 
            const data = await response.json();

            if (data.error) {
                showError(data.error);
                return;
            }

            allUsers = data;
            updateDashboardStats(allUsers);
            renderTable(allUsers);

        } catch (error) {
            showError("Failed to fetch data from server.");
            console.error(error);
        }
    }

    // 2. ڈیش بورڈ کارڈز کے نمبرز اپ ڈیٹ کرنا
    function updateDashboardStats(users) {
        const total = users.length;
        const active = users.filter(u => u.status === 'active' && u.is_frozen != 1 && u.is_locked != 1).length;
        const frozen = users.filter(u => u.is_frozen == 1).length;
        const blocked = users.filter(u => u.is_locked == 1).length;

        document.getElementById("statTotalUsers").textContent = total.toLocaleString();
        document.getElementById("statActiveUsers").textContent = active.toLocaleString();
        document.getElementById("statFrozenUsers").textContent = frozen.toLocaleString();
        document.getElementById("statBlockedUsers").textContent = blocked.toLocaleString();
        
        const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
        document.getElementById("statActivePercentage").textContent = `${activePercentage}% active`;
        document.getElementById("totalUsersCount").textContent = `Showing ${total} of ${total} users`;
    }

    // 3. ٹیبل رینڈر کرنا اور ڈائنامک بٹنز لگانا
    function renderTable(users) {
        tableBody.innerHTML = "";

        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-secondary">No records found.</td></tr>`;
            return;
        }

        users.forEach(user => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-surface-container-low transition-colors";

            // سٹیٹس کے بیجز طے کرنا
            let statusBadge = `<span class="px-2 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700">Active</span>`;
            if (user.is_locked == 1) {
                statusBadge = `<span class="px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700">Blocked</span>`;
            } else if (user.is_frozen == 1) {
                statusBadge = `<span class="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">Frozen</span>`;
            } else if (user.status === 'inactive') {
                statusBadge = `<span class="px-2 py-1 text-xs font-bold rounded-full bg-yellow-50 text-yellow-700">Inactive</span>`;
            }

            const phoneNumber = user.phone ? user.phone : "N/A";

            // بٹنوں کا ٹیکسٹ متحرک (Dynamic) کرنا: اگر ڈیٹا بیس میں 1 ہے تو بٹن 'Unlock' یا 'Unfreeze' دکھائے گا
            const freezeBtnText = user.is_frozen == 1 ? 'Unfreeze' : 'Freeze';
            const lockBtnText = user.is_locked == 1 ? 'Unlock' : 'Block';

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-on-surface whitespace-nowrap">${user.full_name}</td>
                <td class="px-6 py-4 text-secondary">${user.email}</td>
                <td class="px-6 py-4 font-mono text-sm text-secondary">${user.cnic || 'N/A'}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-secondary whitespace-nowrap">${phoneNumber}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                    <button class="text-blue-600 hover:text-blue-800 font-medium mr-3" onclick="window.toggleFreeze(${user.user_id})">${freezeBtnText}</button>
                    <button class="text-error hover:text-error-dim font-medium" onclick="window.toggleLock(${user.user_id})">${lockBtnText}</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        setupStaticPagination();
    }

    // 4. سٹیٹس اپ ڈیٹ کرنے کا مین ایکشن فنکشن (یہ بیک اینڈ پر درخواست بھیجتا ہے)
    async function updateUserStatus(userId, actionType) {
        try {
            const response = await fetch("../backend/user/update_user_status.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, action_type: actionType })
            });
            
            const result = await response.json();
            if (result.success) {
                // اگر بیک اینڈ کامیاب رہا تو دوبارہ تازہ ڈیٹا لوڈ کریں
                fetchUsers(); 
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            alert("Failed to connect to server.");
            console.error(error);
        }
    }

    // ان فنکشنز کو ونڈو (Global Scope) پر لانا تاکہ HTML کے onclick پر چل سکیں
    window.toggleFreeze = (id) => { updateUserStatus(id, 'toggle_freeze'); };
    window.toggleLock = (id) => { updateUserStatus(id, 'toggle_lock'); };
    window.editUser = (id) => { alert("Edit User ID: " + id); };

    // ریل ٹائم سرچ فلٹر
    searchInput.addEventListener("input", (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = allUsers.filter(user => 
            user.full_name.toLowerCase().includes(value) || 
            user.email.toLowerCase().includes(value) || 
            (user.cnic && user.cnic.includes(value))
        );
        renderTable(filtered);
    });

    function showError(msg) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-error font-medium">${msg}</td></tr>`;
    }

    function setupStaticPagination() {
        const pagContainer = document.getElementById("userPagination");
        if(pagContainer) {
            pagContainer.innerHTML = `
                <button class="p-2 border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-50" disabled>
                    <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button class="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-sm">1</button>
                <button class="p-2 border border-outline-variant rounded-lg hover:bg-surface-container" disabled>
                    <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            `;
        }
    }

    fetchUsers();
});