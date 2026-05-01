/**
 * Nexus Bank - Customer Authentication Handler
 * Clean & Bug-Free Version
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // فارم ڈیٹا حاصل کریں
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // ان پٹ کی بنیادی تصدیق
        if (!email || !password) {
            alert("براہ کرم ای میل اور پاس ورڈ درج کریں۔");
            return;
        }

        // بٹن کو لاک کریں تاکہ ڈبل کلک نہ ہو
        toggleButtonState(submitBtn, true, "پروسیسنگ ہو رہی ہے...");

        try {
            const response = await fetch('../backend/login.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                // یہ سیشن کوکیز کو براؤزر میں محفوظ رکھنے کے لیے ضروری ہے
                credentials: 'include' 
            });

            // چیک کریں کہ کیا سرور نے صحیح جواب دیا
            if (!response.ok) {
                throw new Error(`سرور ایرر: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // سیشن سیٹ ہونے کے لیے معمولی سا وقفہ اور پھر ری ڈائریکٹ
                setTimeout(() => {
                    window.location.replace('dashboard.html');
                }, 100);
            } else {
                alert(data.message || "ای میل یا پاس ورڈ درست نہیں ہے۔");
                toggleButtonState(submitBtn, false, "Sign In");
            }

        } catch (error) {
            console.error("Login Module Error:", error);
            alert("سرور سے رابطہ کرنے میں مسئلہ پیش آیا۔ براہ کرم انٹرنیٹ چیک کریں۔");
            toggleButtonState(submitBtn, false, "Sign In");
        }
    });
});

/**
 * بٹن کی حالت کنٹرول کرنے والا فنکشن
 */
function toggleButtonState(btn, isDisabled, text) {
    if (!btn) return;
    btn.disabled = isDisabled;
    btn.innerHTML = isDisabled 
        ? `<span class="spinner-border spinner-border-sm"></span> ${text}` 
        : text;
}