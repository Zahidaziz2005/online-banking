<?php
// سیشن شروع کریں
session_start();
header('Content-Type: application/json');

// چیک کریں کہ کیا ایڈمن لاگ ان ہے (آپ کی لاگ ان لاجک کے مطابق سیشن ویری ایبل نام ایڈجسٹ کریں)
if (!isset($_SESSION['staff_id'])) {
    echo json_encode(["success" => false, "message" => "Not authenticated"]);
    exit();
}

require_once '../db_config.php'; // ڈیٹا بیس کنکشن

$staff_id = $_SESSION['staff_id'];

// ڈیٹا بیس سے لاگ ان شدہ ایڈمن کا نام اور رول نکالیں
$query = "SELECT full_name, role FROM staff WHERE staff_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $staff_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "full_name" => $row['full_name'],
        "role" => $row['role']
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Admin not found"]);
}

$stmt->close();
$conn->close();
?>