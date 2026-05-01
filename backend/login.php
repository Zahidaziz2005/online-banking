<?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php'; 

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and Password are required"]);
    exit;
}

// 1. ڈیٹا بیس سے صارف کو تلاش کرنا
$stmt = $conn->prepare("SELECT user_id, full_name, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

// 2. پاس ورڈ کی تصدیق (تبدیلی یہاں ہے)
// ہم === کے بجائے password_verify استعمال کریں گے
if ($user && password_verify($password, $user['password'])) {
    
    // سیشن میں ڈیٹا محفوظ کرنا
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['user_name'] = $user['full_name'];

    echo json_encode(["success" => true, "message" => "Login successful"]);
} else {
    // اگر یوزر نہیں ملا یا پاس ورڈ غلط ہے
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
}
?>