<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$data = json_decode(file_get_contents('php://input'), true);

// تمام ضروری فیلڈز چیک کریں، بشمول CNIC
if (empty($data['full_name']) || empty($data['email']) || empty($data['cnic']) || empty($data['password'])) {
    echo json_encode(["success" => false, "message" => "تمام خانے پُر کریں۔"]);
    exit;
}

$full_name = $conn->real_escape_string($data['full_name']);
$email = $conn->real_escape_string($data['email']);
$cnic = $conn->real_escape_string($data['cnic']); // نئی لائن
$password = password_hash($data['password'], PASSWORD_BCRYPT);

$conn->begin_transaction();

try {
    // SQL میں CNIC شامل کریں
    $sql_user = "INSERT INTO users (full_name, email, cnic, password, role) VALUES (?, ?, ?, ?, 'user')";
    $stmt = $conn->prepare($sql_user);
    $stmt->bind_param("ssss", $full_name, $email, $cnic, $password); // "ssss" اب چار اسٹرنگز کے لیے ہے
    $stmt->execute();
    
    $user_id = $conn->insert_id;

    $account_number = "NX-" . rand(100000, 999999);
    $initial_balance = 0.00; // بینکنگ لاجک کے مطابق بیلنس 0 سے شروع کریں

    $sql_account = "INSERT INTO accounts (user_id, account_number, balance) VALUES (?, ?, ?)";
    $stmt_acc = $conn->prepare($sql_account);
    $stmt_acc->bind_param("isd", $user_id, $account_number, $initial_balance);
    $stmt_acc->execute();

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Registration successful"]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "خرابی: ای میل یا CNIC پہلے سے موجود ہے۔"]);
}

$conn->close();
?>