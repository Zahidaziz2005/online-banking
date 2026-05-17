<?php
require_once '../db_config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// 1. گفتگو حاصل کرنا (GET)
if ($method === 'GET') {
    $ticket_id = intval($_GET['ticket_id']);
    
    // گفتگو کو وقت کے حساب سے ترتیب دیں
    $stmt = $conn->prepare("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC");
    $stmt->bind_param("i", $ticket_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $replies = [];
    while($row = $result->fetch_assoc()) {
        $replies[] = $row;
    }
    echo json_encode(["success" => true, "data" => $replies]);
    exit;
}

// 2. جواب پوسٹ کرنا اور اسٹیٹس بدلنا (POST)
if ($method === 'POST') {
    $ticket_id = intval($_POST['ticket_id']);
    $admin_id  = isset($_POST['admin_id']) ? intval($_POST['admin_id']) : null;
    $message   = $_POST['message'];
    $status    = $_POST['status']; // Open, In Progress, یا Resolved

    // ٹرانزیکشن شروع کریں تاکہ دونوں کام لازمی مکمل ہوں
    $conn->begin_transaction();

    try {
        // الف: ریپلائی ٹیبل میں ریکارڈ ڈالیں
        $reply_query = "INSERT INTO ticket_replies (ticket_id, admin_id, message) VALUES (?, ?, ?)";
        $stmt1 = $conn->prepare($reply_query);
        $stmt1->bind_param("iis", $ticket_id, $admin_id, $message);
        $stmt1->execute();

        // ب: مین ٹکٹ کا اسٹیٹس اپڈیٹ کریں
        $update_query = "UPDATE support_tickets SET status = ? WHERE ticket_id = ?";
        $stmt2 = $conn->prepare($update_query);
        $stmt2->bind_param("si", $status, $ticket_id);
        $stmt2->execute();

        $conn->commit();
        echo json_encode(["success" => true, "data" => "Reply added and ticket updated."]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "error" => "Transaction failed: " . $e->getMessage()]);
    }
    exit;
}