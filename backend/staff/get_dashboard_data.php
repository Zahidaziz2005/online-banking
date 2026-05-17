<?php
// backend/staff/get_dashboard_data.php

// 1. آؤٹ پٹ بفرنگ شروع کریں
ob_start();

// 2. سیشن شروع کریں
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 

// 3. 🚨 سیکیورٹی گارڈ فکس: اگر سیشن میں جو بھی آئی ڈی آپ استعمال کر رہے ہیں، اسے یہاں سیٹ کریں
// اگر آپ staff_id استعمال کرتے ہیں تو نیچے 'staff_id' لکھ دیں، یا اگر کوئی سیشن چیک نہیں رکھنا تو عارضی طور پر اس اف (if) بلاک کو ہٹا کر ٹیسٹ کریں
if (!isset($_SESSION['staff_id']) && !isset($_SESSION['admin_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized access. Staff session not found.'
    ]);
    ob_end_flush();
    exit();
}

// ڈیٹا بیس کنکشن فائل کا درست پاتھ (فولڈر کے حساب سے پاتھ چیک کر لیں، اگر یہ staff فولڈر میں ہے تو پاتھ بدل سکتا ہے)
include_once '../db_config.php'; 

// تمام میٹرکس کا بنیادی سٹرکچر
$response = [
    'success' => false,
    'metrics' => [
        'total_volume'     => '$0.00',
        'active_accounts'  => '0',
        'pending_users'    => '0',
        'active_sessions'  => '0',
        'security_events'  => '0',
        'open_tickets'     => '0'
    ]
];

try {
    if (!$conn) {
        throw new Exception("Database connection failed.");
    }

    // -------------------------------------------------------------------------
    // کوئری 1: ٹرانزیکشنز کا کل حجم (Total Volume)
    // -------------------------------------------------------------------------
    $vol_query = "SELECT SUM(amount) as total_volume FROM transactions WHERE status = 'completed'";
    $vol_result = mysqli_query($conn, $vol_query);
    if ($vol_result) {
        $vol_data = mysqli_fetch_assoc($vol_result);
        $total = $vol_data['total_volume'] ?? 0;

        if ($total >= 1000000000) {
            $response['metrics']['total_volume'] = '$' . number_format($total / 1000000000, 2) . 'B';
        } else if ($total >= 1000000) {
            $response['metrics']['total_volume'] = '$' . number_format($total / 1000000, 2) . 'M';
        } else if ($total > 0) {
            $response['metrics']['total_volume'] = '$' . number_format($total, 2);
        }
    }

    // -------------------------------------------------------------------------
    // کوئری 2: کل ایکٹو اکاؤنٹس (Active Accounts)
    // -------------------------------------------------------------------------
    $active_query = "SELECT COUNT(user_id) as total_active FROM users WHERE status = 'active'";
    $active_result = mysqli_query($conn, $active_query);
    if ($active_result) {
        $active_data = mysqli_fetch_assoc($active_result);
        $response['metrics']['active_accounts'] = number_format($active_data['total_active'] ?? 0);
    }

    // -------------------------------------------------------------------------
    // کوئری 3: پینڈنگ صارفین (Pending Users)
    // -------------------------------------------------------------------------
    $pending_query = "SELECT COUNT(user_id) as total_pending FROM users WHERE status = 'pending'";
    $pending_result = mysqli_query($conn, $pending_query);
    if ($pending_result) {
        $pending_data = mysqli_fetch_assoc($pending_result);
        $response['metrics']['pending_users'] = number_format($pending_data['total_pending'] ?? 0);
    }

    // -------------------------------------------------------------------------
    // کوئری 4: ایکٹو سیشنز (Active Sessions)
    // -------------------------------------------------------------------------
    $sessions_query = "SELECT COUNT(user_id) as active_count FROM users WHERE status = 'active' AND is_frozen = 0 AND is_locked = 0";
    $sessions_result = mysqli_query($conn, $sessions_query);
    if ($sessions_result) {
        $sessions_data = mysqli_fetch_assoc($sessions_result);
        $response['metrics']['active_sessions'] = number_format($sessions_data['active_count'] ?? 0);
    }

    // -------------------------------------------------------------------------
    // کوئری 5: پچھلے 24 گھنٹوں کے سیکیورٹی ایونٹس (Security Events)
    // -------------------------------------------------------------------------
    $security_query = "SELECT COUNT(log_id) as total_events FROM audit_logs WHERE created_at >= NOW() - INTERVAL 1 DAY";
    $security_result = mysqli_query($conn, $security_query);
    if ($security_result) {
        $security_data = mysqli_fetch_assoc($security_result);
        $response['metrics']['security_events'] = number_format($security_data['total_events'] ?? 0);
    }

    // -------------------------------------------------------------------------
    // کوئری 6: کسٹمر سپورٹ کے اوپن ٹکٹس (Open Tickets)
    // -------------------------------------------------------------------------
    $tickets_query = "SELECT COUNT(ticket_id) as total_open FROM support_tickets WHERE status = 'Open'";
    $tickets_result = mysqli_query($conn, $tickets_query);
    if ($tickets_result) {
        $tickets_data = mysqli_fetch_assoc($tickets_result);
        $response['metrics']['open_tickets'] = number_format($tickets_data['total_open'] ?? 0);
    }

    // اگر تمام کوئریز چل گئیں تو کامیابی کا سگنل دیں
    $response['success'] = true;

} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
}

// بفر کلین کریں اور خالص JSON آؤٹ پٹ دیں
ob_end_clean();
echo json_encode($response);
exit();
?>