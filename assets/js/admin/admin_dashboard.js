/**
 * Apex Bank - Unified Admin & Staff Controller
 * Real-Time Metrics, Dynamic Menus & Global Profile Engine
 */

/**
 * 🚨 1️⃣ گلوبل پیج ایکسیس پروٹیکشن گارڈ
 * یہ لاجک غیر مجاز صفحات کو بلاک کر کے صرف اجازت یافتہ یو آر ایلز تک رسائی دیتی ہے
 */
(function checkPageAccess() {
    const currentPath = window.location.pathname;
    
    // صرف یہ دو یو آر ایلز (اور روٹ پاتھ) بنا لاگ ان کے کھل سکتے ہیں
    const publicPages = ['index.html', 'admin_home.html'];
    
    // یہ چیک کرنے کے لیے کہ کیا موجودہ پیج پبلک لسٹ میں ہے؟
    const isPublicPage = publicPages.some(page => currentPath.endsWith(page));
    
    // اگر یوزر روٹ فولڈر میں ہو (یعنی صرف / لکھا ہو) تو اسے جانے دیں
    if (currentPath === '/' || currentPath.endsWith('/')) {
        return;
    }

    // 🔒 اگر پیج پبلک نہیں ہے، تو فوری طور پر پسِ منظر میں سیشن چیک کریں
    if (!isPublicPage) {
        fetch('../backend/staff/staff_profile.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                // اگر لاگ ان نہیں ہے تو سیکیورٹی گارڈ اسے ہوم پیج پر پھینک دے گا
                window.location.href = "admin_home.html";
            }
        })
        .catch(() => {
            window.location.href = "admin_home.html";
        });
    }
})();

/**
 * 2️⃣ پیج لوڈ ایونٹ لسنر
 */
document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname;
    const publicPages = ['index.html', 'admin_home.html'];
    const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

    // 🎯 لوپ سے بچاؤ کا فلٹر: پروفائل صرف تب فیچ کریں جب ہم پروٹیکٹڈ (محفوظ) صفحات پر ہوں
    if (!isPublicPage) {
        fetchAdminProfile();
    }

    // ڈیش بورڈ میٹرکس سیف گارڈ: ڈیٹا صرف تب ہی فیچ کریں اگر 'live-total-volume' کا کارڈ موجود ہو
    if (document.getElementById('live-total-volume')) {
        initializeDashboardEngine();
        setInterval(initializeDashboardEngine, 15000);
    }
});

/**
 * گلوبل ایڈمن پروفائل فیچر
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

            if (nameElement && data.full_name) {
                nameElement.textContent = data.full_name;
            }
            if (roleElement && data.role) {
                const formattedRole = data.role.charAt(0).toUpperCase() + data.role.slice(1);
                roleElement.textContent = formattedRole + " Access";
            }
        } else {
            // سیشن نہ ہونے پر محفوظ یو آر ایل پر ری ڈائریکٹ کریں
            window.location.href = "admin_home.html";
        }
    })
    .catch(error => {
        console.error('Error fetching admin profile:', error);
        window.location.href = "admin_home.html";
    });
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

        const dashboardElements = {
            'live-total-volume': metrics.total_volume,
            'live-active-accounts': metrics.active_accounts,
            'live-pending-users': metrics.pending_users,
            'live-active-sessions': metrics.active_sessions,
            'live-security-events': metrics.security_events,
            'live-open-tickets': metrics.open_tickets
        };

        for (const [elementId, liveValue] of Object.entries(dashboardElements)) {
            const domElement = document.getElementById(elementId);
            if (domElement && liveValue !== undefined) {
                domElement.innerText = liveValue;
            }
        }

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

document.addEventListener('click', function(event) {
    const container = document.getElementById('adminDropdownContainer');
    const menu = document.getElementById('adminActionMenu');
    
    if (container && !container.contains(event.target) && menu && !menu.classList.contains('hidden')) {
        closeAdminMenuImmediate(menu);
    }
});

/**
 * 🚨 گلوبل لائیو لاگ آؤٹ ری ڈائریکشن (درست سیشن ڈسٹرائے ہینڈلر)
 */
function handleAdminLogout(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (confirm("Are you sure you want to log out?")) {
        // سیشن کو ڈیٹا بیس اور سرور لیول پر ختم کرنے کے لیے آپ کی پی ایچ پی لاگ آؤٹ فائل ہٹ ہونی چاہیے
        window.location.href = "../backend/auth/logout.php"; 
    }
}