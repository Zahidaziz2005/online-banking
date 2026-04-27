<?php
session_start();
require_once 'db_config.php'; // یقینی بنائیں کہ یہاں $conn موجود ہے

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    // 1. اکاؤنٹ نمبر اور بیلنس حاصل کریں (Using $conn instead of $pdo)
    $stmt = $conn->prepare("SELECT account_number, balance FROM accounts WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $account = $stmt->get_result()->fetch_assoc();

    if (!$account) {
        echo json_encode(['success' => false, 'message' => 'Account not found']);
        exit();
    }

    $acc_num = $account['account_number'];

    // 2. اس مہینے کی Earnings (ڈپوزٹ + وصول شدہ ٹرانسفرز)
    // ہم صرف 'deposit' کے بجائے وہ تمام رقمیں لیں گے جہاں یوزر Receiver ہے
    $earningStmt = $conn->prepare("SELECT SUM(amount) as total FROM transactions 
                                   WHERE receiver_account = ? 
                                   AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
                                   AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $earningStmt->bind_param("s", $acc_num);
    $earningStmt->execute();
    $earnings = $earningStmt->get_result()->fetch_assoc()['total'] ?? 0;

    // 3. اس مہینے کے Expenses (بھیجے گئے ٹرانسفرز)
    $expenseStmt = $conn->prepare("SELECT SUM(amount) as total FROM transactions 
                                   WHERE sender_account = ? 
                                   AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
                                   AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $expenseStmt->bind_param("s", $acc_num);
    $expenseStmt->execute();
    $expenses = $expenseStmt->get_result()->fetch_assoc()['total'] ?? 0;

    echo json_encode([
        'success' => true,
        'data' => [
            'balance' => $account['balance'],
            'account_number' => $acc_num,
            'earnings' => [
                'total' => (float)$earnings,
                'percentage' => '12.5' 
            ],
            'expenses' => [
                'total' => (float)$expenses,
                'percentage' => '4.2'
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>