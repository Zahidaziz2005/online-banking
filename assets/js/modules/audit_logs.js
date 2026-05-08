import api from '../core/api.js';

const userData = JSON.parse(localStorage.getItem('user_data'));

document.addEventListener('DOMContentLoaded', async () => {
    if (!userData) return;
    
    const logContainer = document.getElementById('audit-log-container');
    const headerRow = logContainer.querySelector('.hidden.md\\:grid'); // Header کو محفوظ رکھیں
    
    try {
        const response = await api.get(`../backend/user/audit_logs.php?user_id=${userData.user_id}`);
        
        if (response.success && response.data.length > 0) {
            // پہلے ہیڈر ڈالیں، پھر ڈیٹا میپ کریں
            let htmlContent = headerRow.outerHTML; 

            response.data.forEach(log => {
                const config = getLogConfig(log.action);
                htmlContent += renderLogItem(log, config);
            });

            logContainer.innerHTML = htmlContent;
        } else {
            showEmptyState(logContainer);
        }
    } catch (error) {
        console.error("Audit Log Error:", error);
        showEmptyState(logContainer);
    }
});

/**
 * لاگ کی قسم کے مطابق آئیکن اور کلر سکیم سیٹ کرنا
 */
function getLogConfig(action) {
    const act = action.toLowerCase();
    if (act.includes('login')) return { icon: 'login', color: 'emerald', label: 'Successful Authorization' };
    if (act.includes('transfer') || act.includes('money')) return { icon: 'move_up', color: 'blue', label: 'Transaction Completed' };
    if (act.includes('password') || act.includes('security')) return { icon: 'lock_reset', color: 'error', label: 'Security Clearance Required' };
    if (act.includes('beneficiary')) return { icon: 'person_add', color: 'secondary', label: 'Account Linked' };
    return { icon: 'settings', color: 'outline', label: 'System Update' };
}

/**
 * ایک سنگل لاگ رو (Row) تیار کرنا
 */
function renderLogItem(log, config) {
    const date = new Date(log.created_at);
    const timeAgo = getTimeAgo(date);

    return `
    <div class="grid grid-cols-1 md:grid-cols-12 px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors duration-200 cursor-pointer items-center gap-y-sm">
        <div class="col-span-4 flex items-center gap-base">
            <div class="w-10 h-10 rounded-full bg-${config.color}-100 flex items-center justify-center text-${config.color}-700">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${config.icon}</span>
            </div>
            <div>
                <p class="font-body-md text-body-md font-semibold text-primary">${log.action}</p>
                <p class="font-body-sm text-body-sm text-${config.color}-600">${config.label}</p>
            </div>
        </div>
        <div class="col-span-3">
            <p class="font-body-sm text-body-sm text-on-surface-variant truncate">${log.device_info}</p>
            <p class="font-label-caps text-[10px] text-outline uppercase tracking-wider">Device Recorded</p>
        </div>
        <div class="col-span-2 font-mono text-body-sm text-on-surface-variant">
            ${log.ip_address}
        </div>
        <div class="col-span-3 text-right">
            <p class="font-body-sm text-body-sm text-primary">${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            <p class="font-body-sm text-[12px] text-outline">${timeAgo}</p>
        </div>
    </div>`;
}

/**
 * "Time Ago" لاجک (مثلاً 2 minutes ago)
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minutes ago";
    return "Just now";
}

function showEmptyState(container) {
    const emptyState = container.querySelector('.hidden.flex-col');
    if (emptyState) {
        container.innerHTML = emptyState.outerHTML.replace('hidden', 'flex');
    }
}