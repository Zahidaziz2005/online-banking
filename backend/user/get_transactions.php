<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ڈیٹا بیس کنکشن فائل شامل کریں
require_once '../db_config.php'; 

try {
    $response = [];

    // ==========================================
    // 1. KPI کارڈز کے لیے اسٹیٹس اور سمری کیلکولیٹ کرنا
    // ==========================================
    
    // کل والیم (Total Volume) - تمام کامیاب ٹرانزیکشنز کی کل رقم
    $vQuery = "SELECT SUM(amount) as total_vol FROM transactions WHERE status = 'completed' OR status = 'success'";
    $vResult = $conn->query($vQuery);
    $total_volume = $vResult->fetch_assoc()['total_vol'] ?? 0;

    // پینڈنگ ٹرانزیکشنز (Pending Authorizations)
    $pQuery = "SELECT COUNT(*) as pending_cnt FROM transactions WHERE status = 'pending'";
    $pResult = $conn->query($pQuery);
    $pending_count = $pResult->fetch_assoc()['pending_cnt'] ?? 0;

    // فیلڈ یا مشکوک ٹرانزیکشنز (Flagged / Failed Transactions)
    $fQuery = "SELECT COUNT(*) as failed_cnt FROM transactions WHERE status = 'failed'";
    $fResult = $conn->query($fQuery);
    $failed_count = $fResult->fetch_assoc()['failed_cnt'] ?? 0;

    // کل ٹرانزیکشنز کی تعداد (ٹوٹل کاؤنٹ تاکہ کامیابی کی شرح نکالی جا سکے)
    $tQuery = "SELECT COUNT(*) as total_cnt FROM transactions";
    $tResult = $conn->query($tQuery);
    $total_count = $tResult->fetch_assoc()['total_cnt'] ?? 0;

    // کامیابی کی شرح (Success Rate Percentage)
    $success_rate = 100; // ڈیفالٹ 100% اگر کوئی ریکارڈ نہ ہو
    if ($total_count > 0) {
        // پینڈنگ اور فیلڈ کے علاوہ باقی سب کامیاب تصور ہوں گی
        $successful_count = $total_count - ($pending_count + $failed_count);
        $success_rate = round(($successful_count / $total_count) * 100, 2);
    }

    // تمام لائیو اسٹیٹس کو ایک آبجیکٹ میں پیک کریں
    $response['stats'] = [
        "total_volume"   => (float)$total_volume,
        "pending_count"  => (int)$pending_count,
        "failed_count"   => (int)$failed_count,
        "success_rate"   => (float)$success_rate
    ];

    // ==========================================
    // 2. مین ٹرانزیکشن لیجر ٹیبل کا ڈیٹا نکالنا (UPDATED QUERY)
    // ==========================================
    
    // ہم نے LEFT JOIN استعمال کیا ہے تاکہ دونوں آئی ڈیز کے متبادل اصل اکاؤنٹ نمبرز حاصل کیے جا سکیں
    $query = "SELECT 
                t.transaction_id, 
                t.sender_account_id, 
                t.receiver_account_id, 
                acc_sender.account_number AS sender_account_number, 
                acc_receiver.account_number AS receiver_account_number, 
                t.amount, 
                t.txn_type, 
                t.status, 
                t.description, 
                t.created_at 
              FROM transactions t
              LEFT JOIN accounts acc_sender ON t.sender_account_id = acc_sender.account_id
              LEFT JOIN accounts acc_receiver ON t.receiver_account_id = acc_receiver.account_id
              ORDER BY t.transaction_id DESC";
              
    $result = $conn->query($query);

    $transactions = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
    }

    $response['success'] = true;
    $response['transactions'] = $transactions;

    // آؤٹ پٹ کو JSON فارمیٹ میں بھیجیں
    echo json_encode($response);

} catch (Exception $e) {
    // کسی بھی ایرر کی صورت میں فرنٹ END کو صاف پیغام بھیجنا
    echo json_encode([
        "success" => false, 
        "error" => "Database operation failed: " . $e->getMessage()
    ]);
}
?>