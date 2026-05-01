<?php
// backend/get_staff_session.php
session_start();
header('Content-Type: application/json');

// چیک کریں کہ کیا اسٹاف لاگ ان ہے
if (isset($_SESSION['staff_name'])) {
    echo json_encode([
        "success" => true,
        "name" => $_SESSION['staff_name'],
        "role" => $_SESSION['staff_role']
    ]);
} else {
    // اگر سیشن نہیں ہے تو ناکامی کا میسج بھیجیں
    echo json_encode(["success" => false, "message" => "Not logged in"]);
}
?>