<?php
/**
 * transfer.php - Updated to match your specific DB Schema
 */
header("Content-Type: application/json");
require_once '../db_config.php';

$content = file_get_contents("php://input");
$data = json_decode($content, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($data)) {
    
    $sender_id    = intval($data['sender_id']);
    $receiver_acc = trim($data['receiver_account']); 
    $amount       = floatval($data['amount']);
    $desc         = $data['description'] ?? 'Fund Transfer';

    if ($amount <= 0) {
        echo json_encode(["success" => false, "message" => "براہ کرم درست رقم درج کریں۔"]);
        exit;
    }

    $conn->begin_transaction();

    try {
        // 1. بھیجنے والے کا اکاؤنٹ ڈیٹا حاصل کریں
        // نوٹ: یہاں ہم 'account_id' حاصل کر رہے ہیں کیونکہ transactions ٹیبل میں اس کی ضرورت ہے
        $stmt = $conn->prepare("SELECT account_id, balance, account_number FROM accounts WHERE user_id = ? FOR UPDATE");
        $stmt->bind_param("i", $sender_id);
        $stmt->execute();
        $sender_data = $stmt->get_result()->fetch_assoc();

        if (!$sender_data) {
            throw new Exception("آپ کا اکاؤنٹ ریکارڈ نہیں ملا۔");
        }
        
        $sender_account_id = $sender_data['account_id'];

        if ($sender_data['balance'] < $amount) {
            throw new Exception("آپ کا بیلنس ناکافی ہے۔");
        }

        if ($sender_data['account_number'] === $receiver_acc) {
            throw new Exception("آپ اپنے ہی اکاؤنٹ میں رقم منتقل نہیں کر سکتے۔");
        }

        // 2. وصول کرنے والے کا 'account_id' حاصل کریں
        $stmt = $conn->prepare("SELECT account_id FROM accounts WHERE account_number = ?");
        $stmt->bind_param("s", $receiver_acc);
        $stmt->execute();
        $receiver = $stmt->get_result()->fetch_assoc();

        if (!$receiver) {
            throw new Exception("وصول کرنے والے کا اکاؤنٹ نمبر موجود نہیں ہے۔");
        }
        $receiver_account_id = $receiver['account_id'];

        // 3. بیلنس اپ ڈیٹ کریں
        $updateSender = $conn->prepare("UPDATE accounts SET balance = balance - ? WHERE account_id = ?");
        $updateSender->bind_param("di", $amount, $sender_account_id);
        $updateSender->execute();

        $updateReceiver = $conn->prepare("UPDATE accounts SET balance = balance + ? WHERE account_id = ?");
        $updateReceiver->bind_param("di", $amount, $receiver_account_id);
        $updateReceiver->execute();

        // 4. ٹرانزیکشن ہسٹری درج کریں (آپ کے کالمز کے مطابق)
        // کالمز: sender_account_id, receiver_account_id, amount, txn_type, status, description
        $txn_type = 'transfer';
        $status = 'completed';
        
        $logQuery = "INSERT INTO transactions (sender_account_id, receiver_account_id, amount, txn_type, status, description) VALUES (?, ?, ?, ?, ?, ?)";
        $logStmt = $conn->prepare($logQuery);
        $logStmt->bind_param("iidsss", $sender_account_id, $receiver_account_id, $amount, $txn_type, $status, $desc);
        $logStmt->execute();

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Congratulations! your transaction is successful"]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} else {
    echo json_encode(["success" => false, "message" => "Invalid Request"]);
}

$conn->close();
?>

