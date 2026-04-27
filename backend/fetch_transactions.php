<?php
header('Content-Type: application/json');
session_start(); // سیشن شروع کرنا ضروری ہے تاکہ لاگ ان یوزر کا ڈیٹا مل سکے

$conn = new mysqli("localhost", "root", "", "nexus_bank");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

// 1. لاگ ان شدہ یوزر کا ڈیٹا بیس والا اکاؤنٹ نمبر حاصل کریں
// (نوٹ: اگر سیشن میں اکاؤنٹ نمبر نہیں ہے تو یوزر آئی ڈی سے ڈیٹا بیس سے نکالیں)
$user_id = $_SESSION['user_id'] ?? 0; 

// 2. ہم SQL میں sender_account اور receiver_account کو بھی شامل کریں گے
$sql = "SELECT transaction_id, sender_account, receiver_account, description, type, amount, created_at 
        FROM transactions 
        ORDER BY created_at DESC LIMIT 10";

$result = $conn->query($sql);

$data = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = [
            "transaction_id" => $row["transaction_id"],
            "sender_account" => $row["sender_account"],     // یہ کالم شامل کرنا ضروری ہے
            "receiver_account" => $row["receiver_account"], // یہ کالم شامل کرنا ضروری ہے
            "description" => $row["description"],
            "type" => $row["type"],
            "amount" => $row["amount"],
            "created_at" => $row["created_at"]
        ];
    }
}

echo json_encode($data);
$conn->close();
?>