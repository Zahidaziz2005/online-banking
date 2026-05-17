<?php
require_once '../db_config.php';
header('Content-Type: application/json');

// ریسپانس بھیجنے کا فنکشن (فرنٹ اینڈ کی 'success' اور 'error' کیز کے مطابق)
function sendResponse(bool $success, mixed $data_or_message) {
    if ($success) {
        echo json_encode(["success" => true, "data" => $data_or_message]);
    } else {
        // فرنٹ اینڈ 'error' کی کی ڈھونڈتا ہے، اس لیے یہاں 'error' استعمال کیا ہے
        echo json_encode(["success" => false, "error" => $data_or_message]);
    }
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. ٹکٹس حاصل کرنا (GET) ---
if ($method === 'GET') {
    if (!isset($_GET['user_id'])) {
        sendResponse(false, "User ID is required");
    }

    $user_id = intval($_GET['user_id']);
    
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
    // ضروری فیلڈز کی تصدیق
    if (empty($_POST['user_id']) || empty($_POST['subject'])) {
        sendResponse(false, "Required fields (User ID or Subject) are missing");
    }

    $user_id     = intval($_POST['user_id']);
    $category    = $_POST['category'] ?? 'Technical Error';
    $subject     = $_POST['subject'];
    $description = $_POST['description'] ?? '';
    
    // آپ کے ڈیٹا بیس اسٹرکچر کے مطابق اضافی اور ضروری ڈیفالٹ ویلیوز
    $assigned_to = null;       // چونکہ نیا ٹکٹ ابھی کسی ایڈمن کو اسائن نہیں ہوا
    $status      = 'Open';     // ڈیفالٹ اسٹیٹس
    $priority    = 'Medium';   // ڈیفالٹ پرائورٹی

    // فائل اپلوڈ ہینڈلنگ
    $file_path = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $target_dir = "../../uploads/tickets/";
        
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $filename = time() . "_" . basename($_FILES["attachment"]["name"]);
        $target_file = $target_dir . $filename;
        
        if (move_uploaded_file($_FILES["attachment"]["tmp_name"], $target_file)) {
            $file_path = "../uploads/tickets/" . $filename; // فرنٹ اینڈ ڈسپلے پاتھ
        }
    }

    // درست کوئیری: اب اس میں assigned_to، status، اور priority سب شامل ہیں
    $query = "INSERT INTO support_tickets (user_id, assigned_to, category, subject, description, attachment_path, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);

    if (!$stmt) {
        sendResponse(false, "Prepare statement failed: " . $conn->error);
    }

    // بائنڈنگ ٹائپس: i (user_id)، i (assigned_to - جو کہ null ہے)، اور باقی 6 اسٹرنگز (ssssss)
    // چونکہ $assigned_to خالی (null) ہو سکتا ہے، اس لیے ہم اسے بھی پاس کر رہے ہیں
    $stmt->bind_param("iissssss", $user_id, $assigned_to, $category, $subject, $description, $file_path, $status, $priority);

    if ($stmt->execute()) {
        sendResponse(true, "Ticket submitted successfully");
    } else {
        // اگر کوئی ڈیٹا بیس کنسٹرینٹ اب بھی مسئلہ کرے گا تو اصل وجہ الرٹ میں دکھ جائے گی
        sendResponse(false, "Database error: " . $stmt->error);
    }
}