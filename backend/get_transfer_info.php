<?php
session_start();
include 'db_config.php'; // اپنی ڈیٹا بیس فائل شامل کریں

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];
// SQL Query کو اپنے اسکیمہ کے مطابق تبدیل کریں
$query = "SELECT u.full_name, a.account_number, a.balance 
          FROM users u 
          JOIN accounts a ON u.user_id = a.user_id 
          WHERE u.user_id = ?";

$stmt = $conn->prepare($query);

$stmt->bind_param("i", $_SESSION['user_id']); // سیشن میں user_id ہونا ضروری ہے

$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

echo json_encode(['success' => true, 'data' => $user]);



?>