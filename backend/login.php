<?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php'; // آپ کی ڈیٹا بیس فائل

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and Password are required"]);
    exit;
}

// ڈیٹا بیس سے صارف کو تلاش کرنا
$stmt = $conn->prepare("SELECT user_id, full_name, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

// پاس ورڈ کی تصدیق
// نوٹ: اگر آپ نے پاس ورڈ ہیش (Hash) کیا ہے تو password_verify استعمال کریں
if ($user && $password === $user['password']) {
    
    // سیشن میں ڈیٹا محفوظ کرنا (انتہائی اہم قدم)
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['user_name'] = $user['full_name'];

    echo json_encode(["success" => true, "message" => "Login successful"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
}
?>