
<?php
session_start();
require_once '../db_config.php'; // ڈیٹا بیس کنکشن فائل کا راستہ

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    // 1. اسٹاف ٹیبل سے یوزر کو تلاش کریں
    $stmt = $conn->prepare("SELECT staff_id, full_name, password, role FROM staff WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($staff = $result->fetch_assoc()) {
        // 2. پاس ورڈ کی تصدیق
        if (password_verify($password, $staff['password'])) {
            // سیشن میں ڈیٹا محفوظ کریں
            $_SESSION['staff_id'] = $staff['staff_id'];
            $_SESSION['full_name'] = $staff['full_name'];
            $_SESSION['role'] = $staff['role'];

            // 3. لاگ ان کا وقت اپ ڈیٹ کریں
            $update_stmt = $conn->prepare("UPDATE staff SET last_login = NOW() WHERE staff_id = ?");
            $update_stmt->bind_param("i", $staff['staff_id']);
            $update_stmt->execute();

            // 4. ایڈمن ڈیش بورڈ پر ری ڈائریکٹ کریں
            header("Location: ../../frontend/admin_dash.html");
            exit();
        } else {
            // پاس ورڈ غلط ہونے کی صورت میں
            header("Location: ../../frontend/admin/login.html?error=invalid_credentials");
        }
    } else {
        // ای میل نہ ملنے کی صورت میں
        header("Location: ../../frontend/admin/login.html?error=user_not_found");
    }
}
?>