import api from '../core/api.js';

const ticketForm = document.getElementById('complaint-form');
const userData = JSON.parse(localStorage.getItem('user_data'));

// اسٹیٹس کے حساب سے بارڈر کا رنگ سیٹ کرنا
function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'open': return 'border-error'; // لال رنگ
        case 'in progress': return 'border-primary'; // نیلا رنگ
        case 'resolved': return 'border-outline-variant'; // سرمئی رنگ
        default: return 'border-outline';
    }
}

// اسٹیٹس کے حساب سے بیج (Badge) کا رنگ سیٹ کرنا
function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'open': return 'bg-error-container text-on-error-container';
        case 'in progress': return 'bg-secondary-container text-on-secondary-container';
        case 'resolved': return 'bg-surface-variant text-on-surface-variant';
        default: return 'bg-outline-variant';
    }
}

// 2. پرانے ٹکٹس لوڈ کرنا
async function loadMyTickets() {
    const container = document.getElementById('tickets-container');
    
    // API سے ڈیٹا لینا (یقینی بنائیں کہ backend/user/tickets.php میں GET ریکوئسٹ ہینڈل ہے)
    const response = await api.get(`../backend/user/tickets.php?user_id=${userData.user_id}`);
    
    if (response.success && response.data.length > 0) {
        container.innerHTML = response.data.map(ticket => `
            <div class="p-sm bg-surface-container-low rounded-lg flex items-center justify-between border-l-4 ${getStatusColor(ticket.status)}">
                <div>
                    <p class="font-body-sm font-bold">#TK-${ticket.ticket_id} — ${ticket.subject}</p>
                    <p class="text-[12px] text-on-surface-variant">${new Date(ticket.created_at).toLocaleDateString()} • ${ticket.priority} Priority</p>
                </div>
                <span class="${getStatusBadgeClass(ticket.status)} text-[10px] font-bold px-sm py-1 rounded-full uppercase">${ticket.status}</span>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<p class="text-center text-on-surface-variant text-body-sm">No tickets found.</p>`;
    }
}

// پیج لوڈ ہوتے ہی فنکشن کال کریں
document.addEventListener('DOMContentLoaded', loadMyTickets);

// فارم سبمٹ کرنے والا کوڈ وہی رہے گا جو آپ نے دیا ہے