<?php
session_start();
header('Content-Type: application/json'); // جاوا اسکرپٹ کو بتائیں کہ جواب JSON میں ہے
require_once '../db_config.php';

// سیشن چیک کریں (اگر آپ کا سیشن ویری ایبل صرف 'role' ہے تو اسے یقینی بنائیں)
if (!isset($_SESSION['staff_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized access. Please login again."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // فارم سے آنے والا ڈیٹا حاصل کریں
    $full_name = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $role = isset($_POST['role']) ? $_POST['role'] : 'support';
    $plain_password = isset($_POST['password']) ? $_POST['password'] : '';

    // بنیادی ویلیڈیشن
    if (empty($full_name) || empty($email) || empty($plain_password)) {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit();
    }

    // پاس ورڈ ہیشنگ
    $password = password_hash($plain_password, PASSWORD_DEFAULT);

    // ڈیٹا بیس میں محفوظ کرنے کی کیوری
    $stmt = $conn->prepare("INSERT INTO staff (full_name, email, password, role) VALUES (?, ?, ?, ?)");
    
    if ($stmt) {
        $stmt->bind_param("ssss", $full_name, $email, $password, $role);

        if ($stmt->execute()) {
            // کامیابی کی صورت میں JSON رسپانس بھیجیں
            echo json_encode(["success" => true, "message" => "Staff member added successfully."]);
        } else {
            // اگر ای میل ڈوپلیکیٹ ہو یا کوئی اور مسئلہ ہو
            echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Failed to prepare query: " . $conn->error]);
    }
    
    $conn->close();
    exit();
}