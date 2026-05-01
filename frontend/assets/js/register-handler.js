/**
 * Nexus Bank - User Registration Handler
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // بٹن کو حاصل کریں تاکہ اسے لوڈنگ کے دوران ڈس ایبل کیا جا سکے
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;

        const formData = {
            full_name: document.getElementById('full_name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            cnic: document.getElementById('cnic')?.value // اگر موجود ہو
        };

        try {
            // بٹن کی حالت تبدیل کریں
            submitBtn.disabled = true;
            submitBtn.innerText = "پروسیسنگ...";

            const response = await fetch('../backend/register_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert("اکاؤنٹ کامیابی سے بن گیا ہے! اب آپ لاگ ان کر سکتے ہیں۔");
                window.location.href = 'login.html';
            } else {
                alert("رجسٹریشن میں غلطی: " + result.message);
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        } catch (error) {
            console.error("Registration Error:", error);
            alert("سرور سے رابطہ نہیں ہو سک رہا۔");
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
});