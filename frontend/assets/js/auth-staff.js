/**
 * Nexus Bank - Staff Authentication Handler
 */

// اسٹاف لاگ ان ماڈل کو ٹوگل کرنے کے لیے
function toggleStaffModal() {
    const modal = document.getElementById('staff-modal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const staffLoginForm = document.getElementById('staff-login-form');

    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // فارم ڈیٹا حاصل کریں
            const email = document.getElementById('staff-email').value;
            const password = document.getElementById('staff-password').value;
            const submitBtn = e.target.querySelector('button');

            // UI اپ ڈیٹ: بٹن کو ڈس ایبل کریں
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Verifying...";
            }

            try {
                const response = await fetch('../backend/staff_auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const result = await response.json();

                if (result.success) {
                    // کامیاب لاگ ان پر ری ڈائریکٹ
                    window.location.href = result.redirect || 'admin_panel.html';
                } else {
                    alert(result.message || "Invalid staff credentials!");
                    resetButton(submitBtn);
                }
            } catch (error) {
                console.error("Staff Login Error:", error);
                alert("An error occurred during login. Please check the console.");
                resetButton(submitBtn);
            }
        });
    }
});

// بٹن کو دوبارہ فعال کرنے کا فنکشن
function resetButton(btn) {
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Staff Login";
    }
}