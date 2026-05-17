document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("auditLogTableBody");
    const searchInput = document.querySelector("input[placeholder*='Search logs']");
    
    // کارڈز کے عناصر (Elements)
    const statTotalEvents = document.getElementById("statTotalEvents");
    const statAnomalies = document.getElementById("statAnomalies");
    const statCompliance = document.getElementById("statCompliance");
    const totalEventsCard = document.getElementById("totalEvents24h"); // اگر پرانی آئی ڈی بھی لے آؤٹ میں ہے

    let allLogs = [];

    // 1. بیک اینڈ سے آڈٹ لاگز اور اسٹیٹس لانے کا واحد فنکشن
    async function fetchAuditLogs() {
        try {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-secondary">Loading security audit logs...</td></tr>`;
            }
            
            const response = await fetch("../backend/user/get_audit_logs.php");
            const data = await response.json();

            if (!data.success) {
                showError(data.error);
                return;
            }

            // 🌟 کارڈز کے لائیو شماریات (Stats) کو اپ ڈیٹ کرنے کی لاجک
            if (data.stats) {
                if (statTotalEvents) statTotalEvents.textContent = data.stats.total_events.toLocaleString();
                if (statAnomalies) statAnomalies.textContent = data.stats.anomalies.toLocaleString();
                if (statCompliance) statCompliance.textContent = data.stats.compliance;
                
                // بیک ورڈ کمپیٹیبلٹی کے لیے (اگر آپ کا پرانا ٹوٹل کارڈ بھی ایچ ٹی ایم ایل میں موجود ہے)
                if (totalEventsCard && data.stats.total_events) {
                    totalEventsCard.textContent = data.stats.total_events.toLocaleString();
                }
            } else if (data.total_events_24h && totalEventsCard) {
                // اگر پرانا پی ایچ پی اسٹرکچر آ رہا ہو
                totalEventsCard.textContent = data.total_events_24h.toLocaleString();
            }

            allLogs = data.logs || [];
            renderTable(allLogs);

        } catch (error) {
            showError("Failed to fetch data from server.");
            console.error("Fetch Error:", error);
        }
    }

    // 2. براؤزر/ڈیوائس سٹرنگ کو آئیکن اور ٹیکسٹ میں بدلنے کا ہیلپر فنکشن
    function parseDeviceInfo(userAgent) {
        if (!userAgent) return { icon: "desktop_windows", text: "Unknown Device" };
        
        let icon = "desktop_windows";
        let text = "Unknown System";

        if (userAgent.includes("Windows")) {
            icon = "desktop_windows";
            text = "Windows PC";
        } else if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS")) {
            icon = "laptop_mac";
            text = "macOS Device";
        } else if (userAgent.includes("Android")) {
            icon = "phone_android";
            text = "Android Phone";
        } else if (userAgent.includes("iPhone")) {
            icon = "phone_iphone";
            text = "iPhone";
        }

        // براؤزر کا نام فلٹر کرنا
        if (userAgent.includes("Chrome")) text += " / Chrome";
        else if (userAgent.includes("Firefox")) text += " / Firefox";
        else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) text += " / Safari";

        return { icon, text };
    }

    // 3. ٹیبل کے اندر ڈیٹا رینڈر کرنے کا ڈائنامک فنکشن
    function renderTable(logs) {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (logs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-secondary">No audit logs found.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-surface-container-low/50 transition-colors";

            const device = parseDeviceInfo(log.device_info);

            // تاریخ اور وقت کا خوبصورت فارمیٹ
            const logDate = new Date(log.created_at);
            const formattedDate = logDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) + " · " + logDate.toLocaleTimeString('en-US', { hour12: false });

            // ایکشن کے نام کے مطابق کامیابی یا ناکامی کا بیج طے کرنا
            const isFailed = log.action.toLowerCase().includes("failed") || log.action.toLowerCase().includes("unauthorized");
            const statusBadge = isFailed 
                ? `<span class="px-2 py-1 bg-red-100 text-red-700 text-[11px] font-bold rounded-full uppercase">Failed</span>`
                : `<span class="px-2 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase">Success</span>`;

            tr.innerHTML = `
                <td class="px-6 py-5">
                    <div class="flex flex-col">
                        <span class="font-medium text-on-surface">${log.action}</span>
                        <span class="text-label-sm text-secondary">User ID: ${log.user_id}</span>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex items-center gap-2 text-on-surface">
                        <span class="material-symbols-outlined text-[18px]">${device.icon}</span>
                        <span class="font-body-md">${device.text}</span>
                    </div>
                </td>
                <td class="px-6 py-5 font-body-md text-secondary">${log.ip_address || '::1'}</td>
                <td class="px-6 py-5 font-body-md text-secondary">${formattedDate}</td>
                <td class="px-6 py-5 text-right">${statusBadge}</td>
            `;
            tableBody.appendChild(tr);
        });

        // ٹیبل کے نیچے لکھی ہوئی کل گنتی کو اپ ڈیٹ کرنا
        const counterText = document.querySelector(".bg-surface-container-low span.text-label-sm");
        if (counterText) {
            counterText.textContent = `Showing 1-${logs.length} of ${logs.length} logs`;
        }
    }

    // 4. لائیو سرچ فلٹر
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const value = e.target.value.toLowerCase();
            const filtered = allLogs.filter(log => 
                log.action.toLowerCase().includes(value) || 
                (log.ip_address && log.ip_address.toLowerCase().includes(value)) || 
                (log.user_id && log.user_id.toString().includes(value))
            );
            renderTable(filtered);
        });
    }

    function showError(msg) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-error font-medium">${msg}</td></tr>`;
        }
    }

    // پیج لوڈ ہوتے ہی فنکشن کو رن کریں
    fetchAuditLogs();
});