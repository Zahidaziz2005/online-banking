<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$stats = [];

// 1. کل یوزرز
$res = $conn->query("SELECT COUNT(*) as total FROM users");
$stats['total_users'] = $res->fetch_assoc()['total'];

// 2. ایکٹو یوزرز
$res = $conn->query("SELECT COUNT(*) as active FROM users WHERE is_frozen = 0");
$stats['active_users'] = $res->fetch_assoc()['active'];

// 3. فریز اکاؤنٹس
$res = $conn->query("SELECT COUNT(*) as frozen FROM users WHERE is_frozen = 1");
$stats['frozen_users'] = $res->fetch_assoc()['frozen'];

echo json_encode($stats);
?>