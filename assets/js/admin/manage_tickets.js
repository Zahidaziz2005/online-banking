async function loadChatReplies(ticketId, baseDescription) {
    const chatContainer = document.getElementById("chatContainer");
    if (!chatContainer) return;
    
    chatContainer.innerHTML = "";

    // 1. کلائنٹ کی بنیادی بنیادی کوئیری (تصویر کے پہلے گرے ببل کی طرح)
    if (baseDescription) {
        chatContainer.innerHTML += `
            <div class="bg-slate-100 text-slate-700 p-4 rounded-2xl rounded-tl-none border border-slate-200/60 max-w-[85%] mr-auto shadow-sm">
                <p class="text-body-md leading-relaxed font-medium text-[13px]">${baseDescription}</p>
            </div>
        `;
    }

    try {
        const res = await fetch(`../backend/staff/manage_tickets.php?action=get_replies&ticket_id=${ticketId}`);
        const data = await res.json();

        if (data.success && data.replies) {
            data.replies.forEach(reply => {
                const isStaff = reply.admin_id !== null && reply.admin_id !== undefined;
                
                // تصویر کے مطابق ایڈمن کا میسج گہرا نیلے رنگ کا ہوگا اور دائیں الائن ہوگا
                const bubbleClass = isStaff 
                    ? "bg-blue-600 text-white ml-auto rounded-tr-none shadow-md shadow-blue-600/5" 
                    : "bg-slate-100 text-slate-700 mr-auto rounded-tl-none border border-slate-200/60 shadow-sm";
                
                const metaClass = isStaff ? "text-blue-100/80 text-right" : "text-slate-400 text-left";
                const senderName = isStaff ? (reply.sender_name || 'saad') : 'Client';

                chatContainer.innerHTML += `
                    <div class="${bubbleClass} p-4 rounded-2xl max-w-[85%] space-y-1 my-2 transition-all">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-extrabold tracking-wider uppercase ${metaClass}">${senderName}</span>
                            ${!isStaff ? `<span class="text-[9px] text-slate-400 font-medium">${reply.category || 'Technical Error'}</span>` : ''}
                        </div>
                        <p class="text-[13px] leading-relaxed pt-0.5 font-medium">${reply.message}</p>
                        <p class="text-[9px] block text-right opacity-60 font-mono pt-1">${reply.created_at || '17/05/2026, 14:49:37'}</p>
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