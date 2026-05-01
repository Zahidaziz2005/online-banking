<?php
header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "nexus_bank");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

/* Check login */
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "User not logged in"
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

/* Step 1: Get logged-in user's account number */
$stmt = $conn->prepare("SELECT account_number FROM accounts WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$account = $result->fetch_assoc();

if (!$account) {
    echo json_encode([
        "success" => false,
        "message" => "Account not found"
    ]);
    exit;
}

$account_number = $account['account_number'];

/* Step 2: Get only this user's transactions */
$stmt2 = $conn->prepare("
    SELECT transaction_id,
           sender_account,
           receiver_account,
           description,
           type,
           amount,
           created_at
    FROM transactions
    WHERE sender_account = ?
       OR receiver_account = ?
    ORDER BY created_at DESC
    LIMIT 25
");

$stmt2->bind_param("ss", $account_number, $account_number);
$stmt2->execute();

$result2 = $stmt2->get_result();

$data = [];

while ($row = $result2->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

$conn->close();
?>