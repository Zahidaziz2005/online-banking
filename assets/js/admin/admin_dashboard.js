/**
 * Apex Bank - Unified Admin & Staff Controller
 * Real-Time Metrics, Dynamic Menus & Global Profile Engine
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // 1️⃣ گلوبل پروفائل انجن: یہ ہر اس پیج پر چلے گا جہاں یہ فائل لنک ہوگی
    fetchAdminProfile();

    // 2️⃣ ڈیش بورڈ میٹرکس سیف گارڈ: ڈیٹا صرف تب ہی فیچ کریں اگر 'live-total-volume' کا کارڈ موجود ہو
    if (document.getElementById('live-total-volume')) {
        initializeDashboardEngine();
        // ہر 15 سیکنڈ بعد پسِ منظر میں ڈیٹا اپڈیٹ کریں
        setInterval(initializeDashboardEngine, 15000);
    }
});

/**
 * گلوبل ایڈمن پروفائل فیچر (ہر پیج پر پروفائل بائنڈ کرنے کے لیے)
 */
function fetchAdminProfile() {
    fetch('../backend/staff/staff_profile.php')
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const nameElement = document.getElementById('adminProfileName');
            const roleElement = document.getElementById('adminProfileRole');

            // اگر ایچ ٹی ایم ایل ایلیمنٹس اسکرین پر موجود ہوں تو ڈیٹا داخل کریں
            if (nameElement && data.full_name) {
                nameElement.textContent = data.full_name;
            }
            if (roleElement && data.role) {
                const formattedRole = data.role.charAt(0).toUpperCase() + data.role.slice(1);
                roleElement.textContent = formattedRole + " Access";
            }
        } else {
            // اگر سیشن لاگ آؤٹ ہو چکا ہو تو سیکیورٹی ری ڈائریکشن کریں
            window.location.href = "login.html";
        }
    })
    .catch(error => console.error('Error fetching admin profile:', error));
}

/**
 * ماسٹر کنٹرولر: تمام ڈیش بورڈ کارڈز کا ڈیٹا مانیٹر اور اپڈیٹ کرتا ہے
 */
async function initializeDashboardEngine() {
    const apiURL = '../backend/staff/get_dashboard_data.php';

    try {
        const response = await fetch(apiURL);
        if (!response.ok) throw new Error(`HTTP Matrix Error! Status: ${response.status}`);
        
        const data = await response.json();
        if (!data || !data.success || !data.metrics) return;

        const metrics = data.metrics;

        // ڈوم ایلیمنٹس اور ڈیٹا میٹرکس کی سیف میپنگ
        const dashboardElements = {
            'live-total-volume': metrics.total_volume,
            'live-active-accounts': metrics.active_accounts,
            'live-pending-users': metrics.pending_users,
            'live-active-sessions': metrics.active_sessions,
            'live-security-events': metrics.security_events,
            'live-open-tickets': metrics.open_tickets
        };

        // صرف موجودہ کارڈز کو اپڈیٹ کریں (تاکہ کوڈ کریش نہ ہو)
        for (const [elementId, liveValue] of Object.entries(dashboardElements)) {
            const domElement = document.getElementById(elementId);
            if (domElement && liveValue !== undefined) {
                domElement.innerText = liveValue;
            }
        }

        // اسٹاف سرگرمی (Staff Activity Feed) ہینڈلر
        if (data.staff_activity) {
            updateStaffActivityFeed(data.staff_activity);
        }

    } catch (error) {
        console.error("Dashboard Engine Core Error:", error.message);
    }
}

/**
 * اسٹاف ایکٹیویٹی فیڈ کو محفوظ طریقے سے رینڈر کرنے کا فنکشن
 */
function updateStaffActivityFeed(activities) {
    const activityContainer = document.getElementById('live-staff-activity-container');
    if (!activityContainer) return; 

    activityContainer.innerHTML = ''; 

    if (activities.length === 0) {
        activityContainer.innerHTML = `<p class="text-xs text-secondary italic p-2">No recent activity detected.</p>`;
        return;
    }

    // XSS انجکشن سے بچاؤ کے لیے ہیلپر
    const escapeHTML = str => !str ? '' : str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

    activities.forEach(activity => {
        const safeName = escapeHTML(activity.staff_name);
        const safeAction = escapeHTML(activity.action);
        const safeColor = escapeHTML(activity.dot_color || 'bg-primary');

        activityContainer.innerHTML += `
            <div class="flex gap-3 items-start transition-all duration-300">
                <div class="w-1.5 h-1.5 mt-2 ${safeColor} rounded-full shrink-0 shadow-sm"></div>
                <p class="text-body-md text-primary leading-snug">
                    <span class="font-label-md font-bold">${safeName}</span> ${safeAction}
                </p>
            </div>
        `;
    });
}

/**
 * ایڈمنسٹریٹر ڈراپ اپ مینیو مینجمنٹ
 */
function toggleAdminMenu(event) {
    if (event) event.stopPropagation();

    const menu = document.getElementById('adminActionMenu');
    if (!menu) return;
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        setTimeout(() => {
            menu.classList.remove('opacity-0', 'scale-95');
            menu.classList.add('opacity-100', 'scale-100');
        }, 10);
    } else {
        closeAdminMenuImmediate(menu);
    }
}

function closeAdminMenuImmediate(menu) {
    if (!menu || menu.classList.contains('hidden')) return;
    
    menu.classList.remove('opacity-100', 'scale-100');
    menu.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        menu.classList.add('hidden');
    }, 200);
}

// مینیو کے باہر کلک کرنے پر بند کرنے کی لاجک
document.addEventListener('click', function(event) {
    const container = document.getElementById('adminDropdownContainer');
    const menu = document.getElementById('adminActionMenu');
    
    if (container && !container.contains(event.target) && menu && !menu.classList.contains('hidden')) {
        closeAdminMenuImmediate(menu);
    }
});

/**
 * گلوبل لائیو لاگ آؤٹ ری ڈائریکشن (اینکر ٹیگ ڈیفالٹ بیہیویر کنٹرول کے ساتھ)
 */
function handleAdminLogout(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (confirm("Are you sure you want to log out?")) {
        // چونکہ آپ کی فائلیں فرنٹ اینڈ فولڈر میں ہیں، پاتھ بالکل درست کر دیا گیا ہے
        window.location.href = "../backend/staff/logout.php"; 
    }
}