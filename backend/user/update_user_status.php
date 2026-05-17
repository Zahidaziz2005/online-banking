<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../db_config.php';

try {
    // فرنٹ اینڈ سے آنے والے JSON ڈیٹا کو پڑھیں
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id']) || !isset($input['action_type'])) {
        echo json_encode(["success" => false, "error" => "Missing required parameters."]);
        exit();
    }

    $userId = intval($input['user_id']);
    $actionType = $input['action_type']; // 'toggle_freeze' یا 'toggle_lock'

    // 1. پہلے یوزر کا موجودہ سٹیٹس معلوم کریں
    $checkQuery = "SELECT is_frozen, is_locked FROM users WHERE user_id = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if (!$result) {
        echo json_encode(["success" => false, "error" => "User not found."]);
        exit();
    }

    // 2. ایکشن کے حساب سے ویلیو کو الٹ دیں (0 ہے تو 1، 1 ہے تو 0)
    if ($actionType === 'toggle_freeze') {
        $newValue = $result['is_frozen'] == 1 ? 0 : 1;
        $updateQuery = "UPDATE users SET is_frozen = ? WHERE user_id = ?";
    } elseif ($actionType === 'toggle_lock') {
        $newValue = $result['is_locked'] == 1 ? 0 : 1;
        $updateQuery = "UPDATE users SET is_locked = ? WHERE user_id = ?";
    } else {
        echo json_encode(["success" => false, "error" => "Invalid action type."]);
        exit();
    }

    // 3. ڈیٹا بیس میں اپ ڈیٹ رن کریں
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("ii", $newValue, $userId);
    
    if ($updateStmt->execute()) {
        echo json_encode(["success" => true, "message" => "User status updated successfully."]);
    } else {
        echo json_encode(["success" => false, "error" => "Database update failed."]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "Server error: " . $e->getMessage()]);
}
?>