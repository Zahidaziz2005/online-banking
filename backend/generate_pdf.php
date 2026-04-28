<?php
// کسی بھی قسم کے آؤٹ پٹ کو روکنے کے لیے (تاکہ PDF کریش نہ ہو)
ob_start();
session_start();

require_once 'db_config.php'; 
// راستہ چیک کریں: کیا dompdf فولڈر backend کے اندر ہی ہے؟
require_once 'dompdf/autoload.inc.php'; 

use Dompdf\Dompdf;
use Dompdf\Options;

if (!isset($_SESSION['user_id'])) {
    die("Error: User session expired. Please login again.");
}

$user_id = $_SESSION['user_id'];
$start_date = $_GET['start'] ?? null;
$end_date = $_GET['end'] ?? null;

if (!$start_date || !$end_date) {
    die("Error: Start or End date missing.");
}

try {
    // 1. صارف کا ڈیٹا
    $u_query = "SELECT u.full_name, a.account_number, a.balance FROM users u 
                JOIN accounts a ON u.user_id = a.user_id WHERE u.user_id = ?";
    $u_stmt = $conn->prepare($u_query);
    $u_stmt->bind_param("i", $user_id);
    $u_stmt->execute();
    $user = $u_stmt->get_result()->fetch_assoc();

    if (!$user) { die("Error: Account details not found."); }

    // 2. ٹرانزیکشنز کا ڈیٹا
    $acc_num = $user['account_number'];
    $t_query = "SELECT * FROM transactions WHERE (sender_account = ? OR receiver_account = ?) 
                AND created_at BETWEEN ? AND ? ORDER BY created_at DESC";
    
    $full_start = $start_date . " 00:00:00";
    $full_end = $end_date . " 23:59:59";
    
    $t_stmt = $conn->prepare($t_query);
    $t_stmt->bind_param("ssss", $acc_num, $acc_num, $full_start, $full_end);
    $t_stmt->execute();
    $transactions = $t_stmt->get_result();

    // 3. HTML Content
    $html = '
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #000666; margin-bottom: 20px; padding-bottom: 10px; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #000666; color: #fff; padding: 10px; text-align: left; }
        .data-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .debit { color: #ba1a1a; }
        .credit { color: #1b6d24; }
    </style>
    <div class="header">
        <h1>NEXUS DIGITAL BANK</h1>
        <p>E-Statement: ' . $start_date . ' to ' . $end_date . '</p>
    </div>
    <table class="info-table">
        <tr>
            <td><strong>Customer:</strong> ' . $user['full_name'] . '</td>
            <td align="right"><strong>Account:</strong> ' . $user['account_number'] . '</td>
        </tr>
    </table>
    <table class="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>';

    while ($row = $transactions->fetch_assoc()) {
        $is_debit = ($row['sender_account'] == $acc_num);
        $class = $is_debit ? 'debit' : 'credit';
        $sign = $is_debit ? '-' : '+';
        
        $html .= '<tr>
            <td>' . date("d-M-Y", strtotime($row['created_at'])) . '</td>
            <td>' . $row['description'] . '</td>
            <td class="' . $class . '">' . $sign . '$' . number_format($row['amount'], 2) . '</td>
        </tr>';
    }

    $html .= '</tbody></table>';

    // 4. PDF Generation
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $dompdf = new Dompdf($options);
    
    // آؤٹ پٹ بفر کو صاف کریں
    ob_end_clean(); 
    
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    $dompdf->stream("Nexus_Statement.pdf", ["Attachment" => true]);

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage();
}