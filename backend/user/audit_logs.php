<?php
require_once '../db_config.php';
header('Content-Type: application/json');

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid User"]);
    exit;
}

try {
    // آپ کے اسکیما کے مطابق کوئری
    $query = "SELECT action, ip_address, device_info, created_at 
              FROM audit_logs WHERE user_id = ? 
              ORDER BY created_at DESC LIMIT 50";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }

    echo json_encode(["success" => true, "data" => $logs]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}