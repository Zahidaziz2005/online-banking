<?php
header('Content-Type: application/json');
session_start();
require_once 'db_config.php';

// صرف POST ریکوسٹ قبول کریں
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

// JSON ڈیٹا حاصل کریں
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Please provide email and password"]);
    exit;
}

$email = $conn->real_escape_with_string($data['email']);
$password = $data['password'];

try {
    // اسٹاف ٹیبل میں ای میل تلاش کریں
    $stmt = $conn->prepare("SELECT staff_id, full_name, password, role FROM staff WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $staff = $result->fetch_assoc();

        // پاس ورڈ کی تصدیق
        if (password_verify($password, $staff['password'])) {
            // سیشن میں اسٹاف کا ڈیٹا محفوظ کریں
            $_SESSION['staff_id'] = $staff['staff_id'];
            $_SESSION['staff_name'] = $staff['full_name'];
            $_SESSION['staff_role'] = $staff['role'];

            echo json_encode([
                "success" => true,
                "message" => "Authentication successful",
                "redirect" => "admin_panel.html"
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Staff account not found"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>