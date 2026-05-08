<?php
header("Content-Type: application/json");
require_once '../db_config.php';

$content = file_get_contents("php://input");
$data = json_decode($content, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($data)) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    // 1. یوزر کا ڈیٹا اور اکاؤنٹ کی معلومات حاصل کرنا (پاس ورڈ سلیکٹ کرنا لازمی ہے)
    $stmt = $conn->prepare("SELECT u.user_id, u.full_name, u.email, u.password, a.account_number, a.balance 
                            FROM users u 
                            LEFT JOIN accounts a ON u.user_id = a.user_id 
                            WHERE u.email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        // 2. ہیش شدہ پاس ورڈ کی تصدیق کرنا
        if (password_verify($password, $user['password'])) {

            // سیکیورٹی کے لیے پاس ورڈ کو جواب (Response) سے نکال دیں
            unset($user['password']);

            // ٹوکن بنانا
            $token = bin2hex(random_bytes(32));

            echo json_encode([
                "success" => true,
                "token" => $token,
                "user" => $user,
                "message" => "لاگ ان کامیاب!"
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "غلط پاس ورڈ۔"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "اس ای میل سے کوئی اکاؤنٹ نہیں ملا۔"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "درخواست کا طریقہ غلط ہے۔"]);
}
$conn->close();
?>