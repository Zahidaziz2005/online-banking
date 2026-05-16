document.addEventListener("DOMContentLoaded", function() {
    fetchAdminProfile();
});

function fetchAdminProfile() {
    // بیک اینڈ پی ایچ پی فائل سے رابطہ کریں
    fetch('../backend/staff/staff_profile.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // ایچ ٹی ایم ایل ایلیمنٹس کو آئی ڈی کے ذریعے تلاش کریں اور ڈیٹا داخل کریں
            const nameElement = document.getElementById('adminProfileName');
            const roleElement = document.getElementById('adminProfileRole');

            if (nameElement) nameElement.textContent = data.full_name;
            if (roleElement) {
                // رول کا پہلا حرف بڑا کرنے کے لیے (مثال کے طور پر: admin -> Admin Access)
                const formattedRole = data.role.charAt(0).toUpperCase() + data.role.slice(1);
                roleElement.textContent = formattedRole + " Access";
            }
        } else {
            // اگر سیشن موجود نہیں ہے تو لاگ ان پیج پر بھیج دیں
            window.location.href = "login.html";
        }
    })
    .catch(error => console.error('Error fetching admin profile:', error));
}