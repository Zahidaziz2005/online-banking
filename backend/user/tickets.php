<?php
require_once '../db_config.php';
header('Content-Type: application/json');

// تمام ایررز کو JSON فارمیٹ میں واپس بھیجنے کے لیے ایک فنکشن
function sendResponse(bool $success, mixed $data_or_message) {
    if ($success) {
        echo json_encode(["success" => true, "data" => $data_or_message]);
    } else {
        echo json_encode(["success" => false, "message" => $data_or_message]);
    }
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. ٹکٹس حاصل کرنا (GET) ---
if ($method === 'GET') {
    if (!isset($_GET['user_id'])) {
        sendResponse(false, "User ID is required");
    }

    $user_id = intval($_GET['user_id']); // سیکیورٹی کے لیے انٹیجر میں تبدیل کریں
    
    // Prepared Statement استعمال کریں تاکہ SQL Injection نہ ہو
    $stmt = $conn->prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    
    sendResponse(true, $tickets);
}

// --- 2. نیا ٹکٹ جمع کرنا (POST) ---
if ($method === 'POST') {
    // ضروری فیلڈز چیک کریں
    if (empty($_POST['user_id']) || empty($_POST['subject'])) {
        sendResponse(false, "Required fields are missing");
    }

    $user_id     = $_POST['user_id'];
    $category    = $_POST['category'] ?? 'General';
    $subject     = $_POST['subject'];
    $description = $_POST['description'] ?? '';
    
    // فائل ہینڈلنگ کو الگ کریں
    $file_path = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $target_dir = "../../uploads/tickets/";
        
        // اگر فولڈر نہیں ہے تو بنائیں
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $filename = time() . "_" . basename($_FILES["attachment"]["name"]);
        $target_file = $target_dir . $filename;
        
        if (move_uploaded_file($_FILES["attachment"]["tmp_name"], $target_file)) {
            $file_path = "uploads/tickets/" . $filename; // ڈیٹا بیس کے لیے چھوٹا پاتھ
        }
    }

    // ڈیٹا بیس میں انسرٹ کریں
    $query = "INSERT INTO support_tickets (user_id, category, subject, description, attachment_path) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("issss", $user_id, $category, $subject, $description, $file_path);

    if ($stmt->execute()) {
        // آڈٹ لاگ کے لیے یہاں اپنا فنکشن کال کر سکتے ہیں
        // logAction($user_id, "Submitted Ticket: " . $subject); 
        sendResponse(true, "Ticket submitted successfully");
    } else {
        sendResponse(false, "Database error: " . $stmt->error);
    }
}