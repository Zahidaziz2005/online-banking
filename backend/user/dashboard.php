<?php
header("Content-Type: application/json");
require_once '../db_config.php';

// نوٹ: یہاں اصل میں سیشن یا ٹوکن سے یوزر آئی ڈی لی جاتی ہے
// فی الحال ہم ٹیسٹنگ کے لیے اسے سادہ رکھ رہے ہیں
$user_id = $_GET['user_id'] ?? 1; 

$response = ["success" => false];

// 1. بیلنس اور اکاؤنٹ کی معلومات حاصل کریں
$query = "SELECT account_number, balance FROM accounts WHERE user_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$accResult = $stmt->get_result()->fetch_assoc();

if ($accResult) {
    $response["success"] = true;
    $response["user"] = [
        "account_no" => $accResult['account_number'],
        "balance" => $accResult['balance']
    ];
    
    // 2. ٹرانزیکشنز حاصل کریں (اگر ٹیبل موجود ہے)
    // فی الحال ہم عارضی ڈیٹا بھیج رہے ہیں
    $response["transactions"] = [
        ["description" => "Initial Deposit", "date" => "2024-03-20", "amount" => 500.00, "status" => "Completed", "type" => "credit"]
    ];
}

echo json_encode($response);
?>