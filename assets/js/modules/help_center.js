import api from '../core/api.js';

const ticketForm = document.getElementById('complaint-form');
const userData = JSON.parse(localStorage.getItem('user_data'));
const attachmentInput = document.getElementById('attachment-input');
const fileNameDisplay = document.getElementById('file-name-display');

// 1. اسٹیٹس کے حساب سے بارڈر کا رنگ سیٹ کرنا
function getStatusColor(status) {
    if (!status) return 'border-outline';
    switch (status.toLowerCase()) {
        case 'open': return 'border-error';
        case 'in progress': return 'border-primary';
        case 'resolved': return 'border-outline-variant';
        default: return 'border-outline';
    }
}

// 2. اسٹیٹس کے حساب سے بیج (Badge) کا رنگ سیٹ کرنا
function getStatusBadgeClass(status) {
    if (!status) return 'bg-outline-variant';
    switch (status.toLowerCase()) {
        case 'open': return 'bg-error-container text-on-error-container';
        case 'in progress': return 'bg-secondary-container text-on-secondary-container';
        case 'resolved': return 'bg-surface-variant text-on-surface-variant';
        default: return 'bg-outline-variant';
    }
}

// 3. پرانے ٹکٹس دائیں پینل میں لوڈ کرنا
async function loadMyTickets() {
    const container = document.getElementById('tickets-container');
    if (!container) return;

    if (!userData || !userData.user_id) {
        container.innerHTML = `<p class="text-center text-error text-body-sm">User is not logged in.</p>`;
        return;
    }
    
    try {
        const response = await api.get(`../backend/user/tickets.php?user_id=${userData.user_id}`);
        
        if (response.success && response.data && response.data.length > 0) {
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
    } catch (error) {
        console.error("Error loading tickets:", error);
    }
}

// 4. فائل اپلوڈر ڈسپلے مینیجر
if (attachmentInput && fileNameDisplay) {
    attachmentInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            fileNameDisplay.classList.remove('text-outline');
            fileNameDisplay.classList.add('text-primary', 'font-bold');
        } else {
            fileNameDisplay.textContent = "PDF, JPG, PNG (Max 5MB)";
            fileNameDisplay.classList.remove('text-primary', 'font-bold');
            fileNameDisplay.classList.add('text-outline');
        }
    });
}

// 5. صرف ایک ہی فائنل سبمٹ ہینڈلر (صرف FETCH کے ساتھ)
if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // براؤزر ریفریش بلاک کریں

        if (!userData || !userData.user_id) {
            alert("Your session expired. Please login again.");
            return;
        }

        const submitBtn = document.getElementById('submit-ticket-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";
        }

        // FormData تیار کرنا
        const formData = new FormData(ticketForm);
        formData.append('user_id', userData.user_id);

        try {
            // صرف سنگل نیٹ ورک ریکوئسٹ
            const response = await fetch('../backend/user/tickets.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert("Ticket submitted successfully!");
                ticketForm.reset(); 
                
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = "PDF, JPG, PNG (Max 5MB)";
                    fileNameDisplay.classList.remove('text-primary', 'font-bold');
                    fileNameDisplay.classList.add('text-outline');
                }

                // دائیں پینڈل فوری اپڈیٹ
                await loadMyTickets();
            } else {
                // اگر اصل میں پی ایچ پی فیل ہو تو صرف تب ایرر دکھائے
                alert(data.error || "Failed to submit ticket.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Connection error. Ticket might have been created, checking dashboard...");
            await loadMyTickets();
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Ticket";
            }
        }
    });
}

// پہلی بار پیج لوڈ ہونے پر ڈیٹا رینڈر کریں
document.addEventListener('DOMContentLoaded', loadMyTickets);