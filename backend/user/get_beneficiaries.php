<?php
/**
 * beneficiaries.php - Single Endpoint for Fetching and Adding Beneficiaries
 */

require_once '../db_config.php';
header('Content-Type: application/json');

// ریکوئسٹ میتھڈ چیک کریں
$method = $_SERVER['REQUEST_METHOD'];

try {
    // ---------------------------------------------------------
    // 1. FETCH BENEFICIARIES (GET Request)
    // ---------------------------------------------------------
    if ($method === 'GET') {
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        if ($user_id <= 0) {
            echo json_encode(["success" => false, "message" => "Invalid User ID"]);
            exit;
        }

        $query = "SELECT * FROM beneficiaries WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $beneficiaries = [];
        while ($row = $result->fetch_assoc()) {
            $beneficiaries[] = $row;
        }

        echo json_encode(["success" => true, "data" => $beneficiaries]);
    } 

    // ---------------------------------------------------------
    // 2. ADD NEW BENEFICIARY (POST Request)
    // ---------------------------------------------------------
    elseif ($method === 'POST') {
        // JSON ڈیٹا حاصل کریں
        $data = json_decode(file_get_contents("php://input"), true);

        // ویلیڈیشن (Validation)
        if (empty($data['user_id']) || empty($data['account_number']) || empty($data['bank_name'])) {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        $user_id = intval($data['user_id']);
        $acc_no = trim($data['account_number']);
        $bank = trim($data['bank_name']);
        $nick = isset($data['nickname']) ? trim($data['nickname']) : '';

        $query = "INSERT INTO beneficiaries (user_id, account_number, bank_name, nickname) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("isss", $user_id, $acc_no, $bank, $nick);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Beneficiary added successfully"]);
        } else {
            // اگر اکاؤنٹ نمبر پہلے سے موجود ہو (Unique constraint کی صورت میں)
            if ($conn->errno == 1062) {
                echo json_encode(["success" => false, "message" => "Account already exists"]);
            } else {
                echo json_encode(["success" => false, "message" => "Database error during insert"]);
            }
        }
    } 
    
    else {
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
    }

} catch (Exception $e) {
    // ایرر ہینڈلنگ
    echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
}