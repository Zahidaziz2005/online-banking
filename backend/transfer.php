<?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php'; // فائل کا نام آپ کے فولڈر کے مطابق 'db_config.php' ہے

// 1. سیشن چیک کریں: کیا صارف لاگ ان ہے؟
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Session expired. Please login again."]);
    exit;
}

// فرنٹ اینڈ سے ڈیٹا حاصل کرنا
$data = json_decode(file_get_contents('php://input'), true);
$sender_id = $_SESSION['user_id']; 
$receiver_account_num = $data['recipient'] ?? '';
$amount = isset($data['amount']) ? floatval($data['amount']) : 0;
$description = $data['purpose'] ?? 'General Transfer';

// بنیادی ویلیڈیشن
if ($amount <= 0 || empty($receiver_account_num)) {
    echo json_encode(["success" => false, "message" => "Invalid amount or recipient account."]);
    exit;
}

// ڈیٹا بیس ٹرانزیکشن شروع کریں
$conn->begin_transaction();

try {
    // 2. بھیجنے والے (Sender) کا ڈیٹا حاصل کریں
    $stmt = $conn->prepare("SELECT account_number, balance FROM accounts WHERE user_id = ?");
    $stmt->bind_param("i", $sender_id);
    $stmt->execute();
    $sender_data = $stmt->get_result()->fetch_assoc();

    if (!$sender_data) {
        throw new Exception("Sender account not found.");
    }

    $sender_account_num = $sender_data['account_number'];

    // سیکیورٹی چیک: کیا صارف خود کو تو پیسے نہیں بھیج رہا؟
    if ($sender_account_num === $receiver_account_num) {
        throw new Exception("You cannot transfer money to your own account.");
    }

    // بیلنس چیک کریں
    if ($sender_data['balance'] < $amount) {
        throw new Exception("Insufficient balance. Your current balance is $" . number_format($sender_data['balance'], 2));
    }

    // 3. وصول کرنے والے (Receiver) کا وجود چیک کریں
    $stmt = $conn->prepare("SELECT account_id FROM accounts WHERE account_number = ?");
    $stmt->bind_param("s", $receiver_account_num);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        throw new Exception("Recipient account number not found in our records.");
    }

    // 4. رقم کی منتقلی (Update Balances)
    // بھیجنے والے کے اکاؤنٹ سے کٹوتی
    $stmt = $conn->prepare("UPDATE accounts SET balance = balance - ? WHERE account_number = ?");
    $stmt->bind_param("ds", $amount, $sender_account_num);
    $stmt->execute();

    // وصول کرنے والے کے اکاؤنٹ میں اضافہ
    $stmt = $conn->prepare("UPDATE accounts SET balance = balance + ? WHERE account_number = ?");
    $stmt->bind_param("ds", $amount, $receiver_account_num);
    $stmt->execute();

    // 5. ٹرانزیکشن ہسٹری درج کرنا (یہاں آپ کا کمال ہے)
    $type = 'transfer';
    $stmt = $conn->prepare("INSERT INTO transactions (sender_account, receiver_account, amount, type, description) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssdss", $sender_account_num, $receiver_account_num, $amount, $type, $description);
    $stmt->execute();

    // سب کچھ ٹھیک رہا تو تبدیلیاں محفوظ کریں
    $conn->commit();
    
    echo json_encode([
        "success" => true, 
        "message" => "Transfer Successful!",
        "recipient_name" => $receiver_account_num, 
        "amount_sent" => $amount
    ]);

} catch (Exception $e) {
    // کسی بھی ایرر کی صورت میں تمام تبدیلیاں منسوخ (Rollback) کر دیں
    $conn->rollback();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>