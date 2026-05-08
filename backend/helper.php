<?php
function logAction($conn, $user_id, $action) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $device = $_SERVER['HTTP_USER_AGENT'];
    
    $query = "INSERT INTO audit_logs (user_id, action, ip_address, device_info) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("isss", $user_id, $action, $ip, $device);
    $stmt->execute();
}
?>