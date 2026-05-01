<?php
// backend/get_all_users.php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php';

// سیکیورٹی چیک: صرف لاگ ان شدہ اسٹاف/ایڈمن ہی یہ لسٹ دیکھ سکے
if (!isset($_SESSION['staff_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}

try {
    // یوزرز اور اکاؤنٹس کا ڈیٹا حاصل کرنے کے لیے SQL
    // ہم LEFT JOIN استعمال کر رہے ہیں تاکہ اگر کسی کا اکاؤنٹ ابھی نہیں بنا تو بھی نام نظر آئے
    $sql = "SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                u.is_frozen, 
                a.account_number, 
                a.balance 
            FROM users u
            LEFT JOIN accounts a ON u.user_id = a.user_id 
            WHERE u.role = 'user'
            ORDER BY u.created_at DESC";

    $result = $conn->query($sql);

    $users = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            // ڈیٹا کو صاف کریں (Null values کو ہینڈل کریں)
            $row['account_number'] = $row['account_number'] ?? 'No Account';
            $row['balance'] = $row['balance'] ?? 0.00;
            $users[] = $row;
        }
        
        echo json_encode($users); // JS اس ڈیٹا کو ڈائریکٹ ارے کے طور پر پڑھے گا
    } else {
        throw new Exception("Query failed");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
} finally {
    $conn->close();
}