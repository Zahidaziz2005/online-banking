document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // ہم وہی طریقہ استعمال کریں گے جو ہم نے ٹرانسفر میں کیا تھا
            try {
                const response = await fetch('/online-banking/backend/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // لاگ ان کامیاب ہونے پر ڈیش بورڈ پر بھیج دیں
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message); // یہاں آپ اپنا Error Toast بھی استعمال کر سکتے ہیں
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert("Server connection failed.");
            }
        });
    }
});