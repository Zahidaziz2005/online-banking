document.addEventListener("DOMContentLoaded", () => {
    const ticketTableBody = document.querySelector("table tbody");
    const replyForm = document.getElementById("ticketReplyForm");
    let globalStaffList = [];

    // ==========================================
    // 1. ڈیش بورڈ پر ٹکٹس اور اسٹاف لسٹ لوڈ کرنا
    // ==========================================
    async function fetchDashboardTickets() {
        try {
            if (ticketTableBody) {
                ticketTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-secondary">Loading ticket streams...</td></tr>`;
            }

            const response = await fetch("../backend/staff/manage_tickets.php?action=fetch_all");
            const data = await response.json();

            if (!data.success) return;

            globalStaffList = data.staff || [];
            renderTicketTable(data.tickets);
        } catch (error) {
            console.error("Error connecting to helpdesk system:", error);
        }
    }

    // ==========================================
    // 2. ٹکٹ ٹیبل کو ڈائنامک جنریٹ کرنا
    // ==========================================
    function renderTicketTable(tickets) {
        if (!ticketTableBody) return;
        ticketTableBody.innerHTML = "";

        if (!tickets || tickets.length === 0) {
            ticketTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant">No support tickets found.</td></tr>`;
            return;
        }

        tickets.forEach(ticket => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-surface-container-low transition-colors cursor-pointer";
            
            // پرائورٹی بیج کا رنگ متعین کرنا
            let priorityClass = "bg-outline-variant text-on-surface-variant";
            if (ticket.priority?.toLowerCase() === 'critical') priorityClass = "bg-red-600 text-white";
            if (ticket.priority?.toLowerCase() === 'high') priorityClass = "bg-amber-500 text-white";

            // اسٹاف اسائنمنٹ کے لیے ڈراپ ڈاؤن بنانا
            let staffOptions = `<option value="">Unassigned</option>`;
            globalStaffList.forEach(member => {
                const selected = (ticket.assigned_to == member.user_id) ? 'selected' : '';
                staffOptions += `<option value="${member.user_id}" ${selected}>${member.full_name}</option>`;
            });

            tr.innerHTML = `
                <td class="px-6 py-5 font-bold text-primary">#TK-${ticket.ticket_id}</td>
                <td class="px-6 py-5 font-medium">${ticket.client_name || 'External User'}</td>
                <td class="px-6 py-5"><span class="${priorityClass} text-[10px] font-bold px-3 py-1 rounded uppercase">${ticket.priority || 'Medium'}</span></td>
                <td class="px-6 py-5 text-body-md">${ticket.category}</td>
                <td class="px-6 py-5">
                    <select class="assign-staff-dropdown bg-surface-container border border-outline-variant rounded-lg p-1.5 text-xs font-medium focus:ring-1 focus:ring-primary" data-ticket-id="${ticket.ticket_id}">
                        ${staffOptions}
                    </select>
                </td>
                <td class="px-6 py-5 text-right">
                    <button class="assign-ticket-btn bg-primary text-white px-4 py-1.5 rounded-lg font-label-md text-xs hover:bg-opacity-90" 
                        data-id="${ticket.ticket_id}" 
                        data-client="${ticket.client_name || 'External User'}"
                        data-category="${ticket.category}"
                        data-priority="${ticket.priority || 'Medium'}"
                        data-desc="${ticket.description || ''}"
                        data-subject="${ticket.subject || ''}"
                        data-status="${ticket.status || 'Open'}">
                        Assign / View
                    </button>
                </td>
            `;
            ticketTableBody.appendChild(tr);
        });

        // ٹیبل رینڈر ہوتے ہی ایونٹس بائنڈ کریں
        attachTableEvents();
    }

    // ==========================================
    // 3. ٹیبل کے ڈائنامک ایونٹس (Dropdown + Button Click)
    // ==========================================
    function attachTableEvents() {
        // اسٹاف اسائن کرنے کی لاجک (Dropdown Change)
        document.querySelectorAll(".assign-staff-dropdown").forEach(dropdown => {
            dropdown.addEventListener("change", async (e) => {
                const ticketId = e.target.getAttribute("data-ticket-id");
                const staffId = e.target.value;

                const formData = new FormData();
                formData.append("ticket_id", ticketId);
                formData.append("staff_id", staffId); // خالی ہونے پر یہ ان اسائن کر دے گا

                try {
                    const res = await fetch("../backend/staff/manage_tickets.php?action=assign_ticket", {
                        method: "POST",
                        body: formData
                    });
                    const result = await res.json();
                    if (result.success) {
                        alert("Ticket assignment updated successfully.");
                        fetchDashboardTickets();
                    } else {
                        alert(result.error || "Failed to assign ticket.");
                    }
                } catch (error) {
                    console.error("Assignment error:", error);
                }
            });
        });

        // اسائن/ویو بٹن پر کلک کرنے کی کلین لاجک
        document.querySelectorAll(".assign-ticket-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                e.stopPropagation(); // روو (Row) کے کلک ایونٹ کو روکنے کے لیے
                
                openTicketModal({
                    ticket_id: button.getAttribute("data-id"),
                    client_name: button.getAttribute("data-client"),
                    category: button.getAttribute("data-category"),
                    priority: button.getAttribute("data-priority"),
                    description: button.getAttribute("data-desc"),
                    subject: button.getAttribute("data-subject"),
                    status: button.getAttribute("data-status")
                });
            });
        });
    }

    // ==========================================
    // 4. لائیو چیٹ ماڈل کھولنا اور ریپلائز لوڈ کرنا
    // ==========================================
    function openTicketModal(ticket) {
        const modal = document.getElementById("ticketModal");
        if (!modal) return;

        // ماڈل فیلڈز کو پاپولیٹ کرنا
        document.getElementById("modalTicketId").value = ticket.ticket_id;
        document.getElementById("modalTicketTitle").textContent = `Ticket #${ticket.ticket_id}: ${ticket.subject || ticket.category}`;
        document.getElementById("modalTicketMeta").textContent = `Client: ${ticket.client_name} | Priority: ${ticket.priority}`;
        
        // اگر ماڈل میں اسٹیٹس اپڈیٹ ڈراپ ڈاؤن موجود ہے تو اس کی ویلیو سیٹ کریں
        const statusDropdown = document.getElementById("modalTicketStatus");
        if (statusDropdown) {
            statusDropdown.value = ticket.status;
        }
        
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        // چیٹ ہسٹری لوڈ کریں
        loadChatReplies(ticket.ticket_id, ticket.description);
    }

    async function loadChatReplies(ticketId, baseDescription) {
        const chatContainer = document.getElementById("chatContainer");
        if (!chatContainer) return;
        
        chatContainer.innerHTML = "";

        // کلائنٹ کا اصل بنیادی میسج پاپولیٹ کرنا
        if (baseDescription) {
            chatContainer.innerHTML += `
                <div class="bg-surface-container-low p-3 rounded-xl border border-outline-variant max-w-[85%] shadow-sm mr-auto">
                    <p class="text-[10px] font-bold text-secondary">Client's Core Query</p>
                    <p class="text-body-md mt-1">${baseDescription}</p>
                </div>
            `;
        }

        try {
            const res = await fetch(`../backend/staff/manage_tickets.php?action=get_replies&ticket_id=${ticketId}`);
            const data = await res.json();

            if (data.success && data.replies) {
                data.replies.forEach(reply => {
                    // اگر admin_id یا staff_id نل نہیں ہے تو وہ اسٹاف ممبر کا ریپلائی ہے
                    const isStaff = reply.admin_id !== null && reply.admin_id !== undefined;
                    const bubbleClass = isStaff 
                        ? "bg-primary text-on-primary ml-auto text-right rounded-br-none" 
                        : "bg-surface-container-high text-on-surface border border-outline-variant mr-auto rounded-bl-none";
                    
                    chatContainer.innerHTML += `
                        <div class="${bubbleClass} p-3 rounded-xl max-w-[85%] space-y-1 shadow-sm my-xs">
                            <p class="text-[10px] font-bold opacity-80">${isStaff ? (reply.sender_name || 'Staff Node') : 'Client'}</p>
                            <p class="text-body-md">${reply.message}</p>
                            <p class="text-[9px] block opacity-60 text-right">${new Date(reply.created_at).toLocaleString()}</p>
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error("Error fetching replies:", error);
        }
        
        // آٹو اسکرول نیچے کی طرف کریں
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // ==========================================
    // 5. فارم کے ذریعے ریپلائی جمع کروانا + اسٹیٹس بدلنا
    // ==========================================
    if (replyForm) {
        replyForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const ticketId = document.getElementById("modalTicketId").value;
            const messageInput = document.getElementById("modalReplyMessage");
            const statusDropdown = document.getElementById("modalTicketStatus");
            
            const message = messageInput.value.trim();
            const updatedStatus = statusDropdown ? statusDropdown.value : 'Open';

            if (!message) return;

            const formData = new FormData();
            formData.append("ticket_id", ticketId);
            formData.append("message", message);
            formData.append("status", updatedStatus); // پی ایچ پی میں اسٹیٹس اپڈیٹ ہینڈل کرنے کے لیے

            // لوکل اسٹوریج سے سیشن ڈیٹا اٹیچ کرنا (اگر لوکل بیک اینڈ مانگ رہا ہو)
            const staffData = JSON.parse(localStorage.getItem('admin_data') || localStorage.getItem('user_data'));
            if (staffData && staffData.admin_id) {
                formData.append("admin_id", staffData.admin_id);
            }

            try {
                const res = await fetch("../backend/staff/manage_tickets.php?action=reply_ticket", {
                    method: "POST",
                    body: formData
                });
                const result = await res.json();

                if (result.success) {
                    messageInput.value = "";
                    // گفتگو اور مرکزی ڈیش بورڈ کو فوری ریفریش کریں
                    await loadChatReplies(ticketId, "");
                    fetchDashboardTickets();
                } else {
                    alert(result.error || "Failed to submit response.");
                }
            } catch (error) {
                console.error("Submission error:", error);
            }
        });
    }

    // ماڈل کو بند کرنے کی گلوبل ونڈو لاجک
    window.closeTicketModal = function() {
        const modal = document.getElementById("ticketModal");
        if (modal) {
            modal.classList.remove("flex");
            modal.classList.add("hidden");
        }
    };

    // پہلی بار چلنے پر ڈیش بورڈ انیشلائز کریں
    fetchDashboardTickets();
});