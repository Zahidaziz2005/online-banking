<?php
header("Content-Type: application/json");
session_start();

// ڈیٹا بیس کنکشن فائل شامل کریں (اپنے پاتھ کے مطابق بدلیں)
require_once '../db_config.php';

$action = $_GET['action'] ?? '';
$response = ['success' => false];

// فرض کریں لاگ ان سیشن موجود ہے
$current_user_id = $_SESSION['user_id'] ?? 10; 

if ($action === 'fetch_all') {
    // ایڈمن کے لیے تمام ٹکٹس اور اسٹاف کی لسٹ لانا
    $tickets_query = "SELECT t.*, u.full_name as client_name, s.full_name as staff_name 
                      FROM support_tickets t 
                      LEFT JOIN users u ON t.user_id = u.user_id
                      LEFT JOIN users s ON t.assigned_to = s.user_id 
                      ORDER BY t.created_at DESC";
    $tickets_res = $conn->query($tickets_query);
    
    $tickets = [];
    while($row = $tickets_res->fetch_assoc()) { $tickets[] = $row; }
    
    // اسٹاف لسٹ (جن کا رول admin یا staff ہو تاکہ انہیں ٹکٹ اسائن کیا جا سکے)
    $staff_res = $conn->query("SELECT user_id, full_name FROM users WHERE role = 'admin'");
    $staff = [];
    while($row = $staff_res->fetch_assoc()) { $staff[] = $row; }
    
    $response = ['success' => true, 'tickets' => $tickets, 'staff' => $staff];
}

if ($action === 'assign_ticket') {
    $ticket_id = $_POST['ticket_id'] ?? 0;
    $staff_id = $_POST['staff_id'] ?? 0;
    
    if ($ticket_id && $staff_id) {
        $stmt = $conn->prepare("UPDATE support_tickets SET assigned_to = ?, status = 'Open' WHERE ticket_id = ?");
        $stmt->bind_param("ii", $staff_id, $ticket_id);
        if ($stmt->execute()) {
            $response['success'] = true;
        } else {
            $response['error'] = "Failed to assign ticket.";
        }
    }
}

if ($action === 'reply_ticket') {
    $ticket_id = $_POST['ticket_id'] ?? 0;
    $message = $_POST['message'] ?? '';
    
    if ($ticket_id && !empty($message)) {
        // ریپلائی ٹیبل میں ڈیٹا ڈالنا
        $stmt = $conn->prepare("INSERT INTO ticket_replies (ticket_id, admin_id, message, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("iis", $ticket_id, $current_user_id, $message);
        
        if ($stmt->execute()) {
            // ٹکٹ کا اسٹیٹس بدل کر 'Answered' کرنا
            $conn->query("UPDATE support_tickets SET status = 'Answered' WHERE ticket_id = $ticket_id");
            $response['success'] = true;
        } else {
            $response['error'] = "Database insertion failed.";
        }
    }
}

if ($action === 'get_replies') {
    $ticket_id = $_GET['ticket_id'] ?? 0;
    $stmt = $conn->prepare("SELECT r.*, u.full_name as sender_name FROM ticket_replies r 
                            LEFT JOIN users u ON r.admin_id = u.user_id 
                            WHERE r.ticket_id = ? ORDER BY r.created_at ASC");
    $stmt->bind_param("i", $ticket_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $replies = [];
    while($row = $res->fetch_assoc()) { $replies[] = $row; }
    $response = ['success' => true, 'replies' => $replies];
}

echo json_encode($response);
exit;
?>