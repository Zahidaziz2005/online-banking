<?php
/**
 * beneficiaries.php - Apex Bank
 * Single Endpoint for Fetching and Adding Beneficiaries with Audit Logging
 */

require_once '../db_config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ---------------------------------------------------------
    // 1. FETCH BENEFICIARIES (GET Request)
    // ---------------------------------------------------------
    if ($method === 'GET') {
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        if ($user_id <= 0) {
            throw new Exception("Invalid User ID");
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
        $data = json_decode(file_get_contents("php://input"), true);

        // لازمی فیلڈز کی ویلیڈیشن
        if (empty($data['user_id']) || empty($data['account_number']) || empty($data['bank_name'])) {
            echo json_encode(["success" => false, "message" => "Required fields are missing"]);
            exit;
        }

        $user_id = intval($data['user_id']);
        $acc_no  = trim($data['account_number']);
        $bank    = trim($data['bank_name']);
        $nick    = isset($data['nickname']) ? trim($data['nickname']) : $bank;

        // ٹرانزیکشن شروع کریں تاکہ ڈیٹا اور لاگ دونوں محفوظ ہوں
        $conn->begin_transaction();

        try {
            // بینیفشری ایڈ کریں
            $insert_query = "INSERT INTO beneficiaries (user_id, account_number, bank_name, nickname) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($insert_query);
            $stmt->bind_param("isss", $user_id, $acc_no, $bank, $nick);
            
            if (!$stmt->execute()) {
                if ($conn->errno == 1062) throw new Exception("Account already exists in your list");
                throw new Exception("Database error: " . $conn->error);
            }

            // آڈٹ لاگ محفوظ کریں (یہاں آپ کا ڈیزائن کردہ اسکیما استعمال ہو رہا ہے)
            $action = "Added Beneficiary: " . $nick;
            $ip     = $_SERVER['REMOTE_ADDR'];
            $device = $_SERVER['HTTP_USER_AGENT'];

            $log_query = "INSERT INTO audit_logs (user_id, action, ip_address, device_info) VALUES (?, ?, ?, ?)";
            $log_stmt = $conn->prepare($log_query);
            $log_stmt->bind_param("isss", $user_id, $action, $ip, $device);
            $log_stmt->execute();

            // سب کچھ ٹھیک ہے تو تبدیلیاں کنفرم کریں
            $conn->commit();
            echo json_encode(["success" => true, "message" => "Beneficiary added and activity logged"]);

        } catch (Exception $innerException) {
            $conn->rollback(); // کسی بھی غلطی کی صورت میں تبدیلی کینسل کریں
            echo json_encode(["success" => false, "message" => $innerException->getMessage()]);
        }
    } 
    
    else {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
}