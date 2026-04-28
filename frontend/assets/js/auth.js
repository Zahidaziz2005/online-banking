/**
 * 1. اسٹاف پورٹل فنکشنز (Staff Portal Functions)
 * ان فنکشنز کو گلوبل اسکوپ میں ہونا چاہیے تاکہ HTML ان تک رسائی حاصل کر سکے
 */
function toggleStaffModal() {
    const modal = document.getElementById('staff-modal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

/**
 * 2. مین ایونٹ لسنرز (Main Event Listeners)
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- کسٹمر لاگ ان ہینڈلر (Customer Login) ---
    const customerLoginForm = document.querySelector('#login-form') || document.querySelector('form:not(#staff-login-form)');
    
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/online-banking/backend/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Customer Login Error:', error);
                alert("سرور سے رابطہ نہیں ہو سکا۔");
            }
        });
    }

    // --- اسٹاف لاگ ان ہینڈلر (Staff Login) ---
    const staffLoginForm = document.getElementById('staff-login-form');
    
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;

            try {
                // نوٹ: پاتھ آپ کے اسٹرکچر کے مطابق '../backend/' یا 'backend/' ہو سکتا ہے
                const response = await fetch('/online-banking/backend/staff_auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();

                if (result.success) {
                    window.location.href = 'admin_panel.html';
                } else {
                    alert(result.message || "غلط اسٹاف کریڈنشلز!");
                }
            } catch (error) {
                console.error("Staff Login Error:", error);
                alert("اسٹاف لاگ ان کے دوران خرابی پیش آئی۔");
            }
        });
    }
});