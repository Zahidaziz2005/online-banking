// ==========================================
// 1. موڈل کنٹرول کرنے کے فنکشنز
// ==========================================

function openAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    const container = document.getElementById('modalContainer');
    
    if(modal && container) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            container.classList.remove('scale-95', 'opacity-0');
            container.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

function closeAddStaffModal() {
    const modal = document.getElementById('addStaffModal');
    const container = document.getElementById('modalContainer');
    
    if(modal && container) {
        container.classList.remove('scale-100', 'opacity-100');
        container.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            const form = document.getElementById('addStaffForm');
            if (form) form.reset(); // فارم ڈیٹا صاف کرنا
        }, 300);
    }
}

// ==========================================
// 2. پیج لوڈ ہونے پر ایونٹس ایکٹیویٹ کرنا
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    // اسٹاف ممبرز کی لسٹ لوڈ کریں
    loadStaffDirectory();

    // ڈیٹا بیس کے ساتھ نیا کنکشن (فارم سبمٹ لاجک)
    const staffForm = document.getElementById('addStaffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', function(e) {
            e.preventDefault(); // پیج کو ری فریش ہونے اور ڈیٹا اوپر یو آر ایل میں جانے سے روکیں

            const formData = new FormData(this);

            // بیک اینڈ پی ایچ پی فائل کو ڈیٹا بھیجنا
            fetch('../backend/staff/add_staff.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Staff member added successfully!');
                    closeAddStaffModal();  // موڈل بند کریں
                    loadStaffDirectory(); // ٹیبل کو فوری لائیو ریفریش کریں تاکہ نیا ڈیٹا نظر آئے
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error submitting staff form:', error);
                alert('Something went wrong. Please check your connection or XAMPP server.');
            });
        });
    }
});

// ==========================================
// 3. پی ایچ پی سے ڈیٹا لا کر ٹیبل بنانا
// ==========================================

function loadStaffDirectory() {
    // XAMPP سرور پر موجود PHP فائل سے ڈیٹا منگوانا
    fetch('../backend/staff/staff_management.php')
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        const tableBody = document.getElementById('staffTableBody');
        const totalCountLabel = document.getElementById('totalStaffCount');
        const totalStaffMain = document.getElementById('totalStaffCountMain'); // مین ڈیش بورڈ کارڈ کا کاؤنٹر
        
        // اگر پیج پر ایلیمنٹ نہ ہو تو کریش ہونے سے بچائیں
        if (!tableBody) return;

        tableBody.innerHTML = ''; // لوڈنگ یا پرانا ڈیٹا صاف کرنا

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-on-surface-variant">No staff members found.</td></tr>`;
            if (totalCountLabel) totalCountLabel.textContent = "Total Staff: 0";
            if (totalStaffMain) totalStaffMain.textContent = "0";
            return;
        }

        // لوپ کے ذریعے ہر اسٹاف ممبر کو ٹیبل میں شامل کرنا
        data.forEach(staff => {
            // نام کے پہلے حروف (Initials) نکالنے کی لوجک
            const nameParts = staff.full_name.split(" ");
            const initials = (nameParts[0].charAt(0) + (nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "")).toUpperCase();

            // اسٹیٹس بیج لاجک
            let statusHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>`;
            
            if (staff.role === 'support' && staff.staff_id % 2 === 0) {
                statusHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">On Leave</span>`;
            }

            // 6 کالمز کا مکمل سٹرکچر
            const rowHTML = `
                <tr class="hover:bg-surface-container-low transition-colors group">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-label-md">
                                ${initials}
                            </div>
                            <div>
                                <p class="font-label-md text-on-surface">${staff.full_name}</p>
                                <p class="text-label-sm text-on-surface-variant">ID: APX-${String(staff.staff_id).padStart(5, '0')}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="capitalize font-body-md text-on-surface">${staff.role}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-body-md text-on-surface-variant">Operations</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-body-md text-on-surface-variant">${staff.email}</span>
                    </td>
                    <td class="px-6 py-4">
                        ${statusHTML}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button class="text-outline hover:text-primary p-1 rounded-full hover:bg-surface-container transition-all">
                            <span class="material-symbols-outlined block">more_vert</span>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += rowHTML;
        });

        // کارڈز اور کاؤنٹرز اپ ڈیٹ کریں
        if (totalCountLabel) totalCountLabel.textContent = `Total Staff: ${data.length}`;
        if (totalStaffMain) totalStaffMain.textContent = Number(data.length).toLocaleString();
    })
    .catch(error => {
        console.error('Error fetching staff data:', error);
        const tableBody = document.getElementById('staffTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-error">Failed to load staff directory.</td></tr>`;
        }
    });
}