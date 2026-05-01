<?php
/**
 * Nexus Bank - Staff Authentication Handler
 * Big Boss (Admin) اور بینک عملے کے لاگ ان کے لیے
 */

header('Content-Type: application/json');
session_start();
require_once 'db_config.php';

// صرف POST ریکوسٹ قبول کریں
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "ناجائز درخواست (Invalid Method)"]);
    exit;
}

// JSON ڈیٹا حاصل کریں
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "براہ کرم ای میل اور پاس ورڈ فراہم کریں"]);
    exit;
}

// چونکہ ہم Prepared Statements استعمال کر رہے ہیں، اس لیے یہاں real_escape_string کی ضرورت نہیں
$email = $data['email'];
$password = $data['password'];

// $stmt کو شروع میں null رکھیں تاکہ VS Code ایرر نہ دے
$stmt = null;

try {
    // اسٹاف ٹیبل میں ای میل تلاش کریں
    $stmt = $conn->prepare("SELECT staff_id, full_name, password, role FROM staff WHERE email = ? LIMIT 1");
    
    if (!$stmt) {
        throw new Exception("ڈیٹا بیس کوئیری میں خرابی پیدا ہوئی۔");
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $staff = $result->fetch_assoc();

        // پاس ورڈ کی تصدیق (Hash Verification)
        if (password_verify($password, $staff['password'])) {
            
            // سیشن میں اسٹاف کا ڈیٹا محفوظ کریں
            $_SESSION['staff_id'] = $staff['staff_id'];
            $_SESSION['staff_name'] = $staff['full_name'];
            $_SESSION['staff_role'] = $staff['role'];

            echo json_encode([
                "success" => true,
                "message" => "لاگ ان کامیاب رہا",
                "redirect" => "admin_panel.html"
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "غلط پاس ورڈ"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "اسٹاف اکاؤنٹ موجود نہیں ہے"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "سرور ایرر: " . $e->getMessage()]);
} finally {
    // VS Code (Intelephense) کے ایرر کا حل: پہلے چیک کریں کہ کیا اسٹیمنٹ موجود ہے
    if ($stmt) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>