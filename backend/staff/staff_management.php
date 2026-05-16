<?php
// جاوا اسکرپٹ کو بتائیں کہ ڈیٹا JSON فارمیٹ میں ہے
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // لوکل ہوسٹ ٹیسٹنگ کے لیے محفوظ سیکیورٹی

require_once '../db_config.php'; // ڈیٹا بیس کنکشن فائل

$query = "SELECT staff_id, full_name, email, role, last_login FROM staff ORDER BY created_at DESC";
$result = $conn->query($query);

$staff_members = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $staff_members[] = $row;
    }
    // ڈیٹا کو JSON میں تبدیل کر کے پرنٹ کریں
    echo json_encode($staff_members);
} else {
    // اگر ڈیٹا بیس کیوری فیل ہو جائے
    echo json_encode(["error" => "Query failed: " . $conn->error]);
}
?>