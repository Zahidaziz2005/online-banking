<?php
require_once '../db_config.php';
require_once '../dompdf/autoload.inc.php'; // آپ کی لائبریری کا راستہ

use Dompdf\Dompdf;
use Dompdf\Options;

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    die("Unauthorized access");
}

try {

// یوزر کی معلومات حاصل کریں (accounts اور users ٹیبل کو جوڑ کر)
$userQuery = "
    SELECT u.full_name, a.account_number, a.balance 
    FROM accounts a 
    JOIN users u ON a.user_id = u.user_id 
    WHERE a.user_id = ? LIMIT 1";

$uStmt = $conn->prepare($userQuery);
$uStmt->bind_param("i", $user_id);
$uStmt->execute();
$userData = $uStmt->get_result()->fetch_assoc();

// اگر یوزر ڈیٹا نہ ملے تو ایرر ہینڈل کریں
if (!$userData) {
    die("User or Account information not found.");
}
   

    // ٹرانزیکشنز حاصل کریں
    $historyQuery = "
        SELECT t.amount, t.status, t.description, t.created_at, sa.account_number as sender 
        FROM transactions t
        JOIN accounts sa ON t.sender_account_id = sa.account_id
        JOIN accounts ra ON t.receiver_account_id = ra.account_id
        WHERE sa.user_id = ? OR ra.user_id = ?
        ORDER BY t.created_at DESC";
    $stmt = $conn->prepare($historyQuery);
    $stmt->bind_param("ii", $user_id, $user_id);
    $stmt->execute();
    $transactions = $stmt->get_result();

    // HTML ڈیزائن تیار کریں
    $html = '
    <style>
        body { font-family: sans-serif; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; }
        .bank-name { color: #1a73e8; font-size: 24px; font-weight: bold; }
        .info-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
        .info-table td { padding: 5px; }
        .txn-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .txn-table th { background: #f8f9fa; border: 1px solid #ddd; padding: 10px; text-align: left; }
        .txn-table td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
        .amount-in { color: green; }
        .amount-out { color: red; }
    </style>
    
    <div class="header">
        <div class="bank-name">APEX BANK</div>
        <p>Official Account Statement</p>
    </div>

    <table class="info-table">
        <tr>
            <td><strong>Account Holder:</strong> ' . $userData['full_name'] . '</td>
            <td align="right"><strong>Statement Date:</strong> ' . date('d M, Y') . '</td>
        </tr>
        <tr>
            <td><strong>Account Number:</strong> ' . $userData['account_number'] . '</td>
            <td align="right"><strong>Current Balance:</strong> PKR ' . number_format($userData['balance'], 2) . '</td>
        </tr>
    </table>

    <table class="txn-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>';

    while ($row = $transactions->fetch_assoc()) {
        $isOut = ($row['sender'] == $userData['account_number']);
        $prefix = $isOut ? '-' : '+';
        $class = $isOut ? 'amount-out' : 'amount-in';
        
        $html .= '
            <tr>
                <td>' . date('d/m/Y H:i', strtotime($row['created_at'])) . '</td>
                <td>' . $row['description'] . '</td>
                <td>' . strtoupper($row['status']) . '</td>
                <td class="' . $class . '">' . $prefix . ' PKR ' . number_format($row['amount'], 2) . '</td>
            </tr>';
    }

    $html .= '</tbody></table>';

    // Dompdf کنفیگریشن
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    
    // فائل ڈاؤن لوڈ کے لیے بھیجیں
    $dompdf->stream("Apex_Statement_" . $userData['account_number'] . ".pdf", ["Attachment" => true]);

} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}