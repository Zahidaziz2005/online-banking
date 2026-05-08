<?php
/**
 * history.php - Optimized for Apex Bank Dashboard & Ledger
 */
header("Content-Type: application/json");
require_once '../db_config.php';

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "صارف کی شناخت نہیں ہو سکی۔"]);
    exit;
}

try {
    // 1. سب سے پہلے یوزر کا اکاؤنٹ نمبر حاصل کریں (تاکہ ہم Inflow/Outflow کا موازنہ کر سکیں)
    $accQuery = "SELECT account_number FROM accounts WHERE user_id = ? LIMIT 1";
    $accStmt = $conn->prepare($accQuery);
    $accStmt->bind_param("i", $user_id);
    $accStmt->execute();
    $user_account = $accStmt->get_result()->fetch_assoc()['account_number'] ?? '';
    $accStmt->close();

    // 2. موجودہ مہینے کا تعین
    $currentMonth = date('m');
    $currentYear = date('Y');

    // 3. ماہانہ خلاصہ (Income/Expense)
    $statsQuery = "
        SELECT 
            SUM(CASE WHEN ra.user_id = ? THEN t.amount ELSE 0 END) as total_income,
            SUM(CASE WHEN sa.user_id = ? THEN t.amount ELSE 0 END) as total_expense
        FROM transactions t
        JOIN accounts sa ON t.sender_account_id = sa.account_id
        JOIN accounts ra ON t.receiver_account_id = ra.account_id
        WHERE (sa.user_id = ? OR ra.user_id = ?) 
        AND MONTH(t.created_at) = ? AND YEAR(t.created_at) = ?";

    $stmtStats = $conn->prepare($statsQuery);
    $stmtStats->bind_param("iiiiii", $user_id, $user_id, $user_id, $user_id, $currentMonth, $currentYear);
    $stmtStats->execute();
    $stats = $stmtStats->get_result()->fetch_assoc();

    // 4. ٹرانزیکشن ہسٹری (With dynamic Labels & Icons)
    $historyQuery = "
        SELECT 
            t.transaction_id, t.amount, t.status, t.description, t.created_at,
            sa.account_number AS sender_acc,
            ra.account_number AS receiver_acc
        FROM transactions t
        JOIN accounts sa ON t.sender_account_id = sa.account_id
        JOIN accounts ra ON t.receiver_account_id = ra.account_id
        WHERE sa.user_id = ? OR ra.user_id = ?
        ORDER BY t.created_at DESC";

    $stmtHistory = $conn->prepare($historyQuery);
    $stmtHistory->bind_param("ii", $user_id, $user_id);
    $stmtHistory->execute();
    $result = $stmtHistory->get_result();
    
    $history = [];
    while ($row = $result->fetch_assoc()) {
        // لاجک: اگر یوزر بھیجنے والا ہے تو یہ 'Transfer' ہے، ورنہ 'Remittance/Deposit'
        $is_outflow = ($row['sender_acc'] == $user_account);
        
        $row['display_type'] = $is_outflow ? 'Corporate Transfer' : 'Inward Remittance';
        $row['icon'] = $is_outflow ? 'sync_alt' : 'account_balance_wallet';
        $row['is_debit'] = $is_outflow; // فرنٹ اینڈ پر رنگ بدلنے کے لیے
        
        $history[] = $row;
    }

    // فائنل ریسپانس
    echo json_encode([
        "success" => true,
        "income"  => $stats['total_income'] ?? 0,
        "expense" => $stats['total_expense'] ?? 0,
        "account_no" => $user_account,
        "data"    => $history
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "سرور ایرر: " . $e->getMessage()]);
} finally {
    if (isset($stmtStats)) $stmtStats->close();
    if (isset($stmtHistory)) $stmtHistory->close();
    $conn->close();
}