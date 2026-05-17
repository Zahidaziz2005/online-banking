<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// آپ کی ڈیٹا بیس کنکشن فائل کا راستہ
require_once '../db_config.php';

try {
    // users ٹیبل سے ڈیٹا حاصل کرنے کی کیوری
    // کیوری میں last_login کی جگہ phone شامل کر دیا گیا ہے
$query = "SELECT user_id, full_name, email, cnic, phone, status, is_frozen, is_locked FROM users ORDER BY user_id DESC";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->execute();
   
    // MySQLi میں رزلٹ حاصل کرنے کا درست طریقہ
    $result = $stmt->get_result();
    
    // تمام ریکارڈز کو ایک ساتھ ایسوسی ایٹو ارے میں نکالنا
    $users = $result->fetch_all(MYSQLI_ASSOC);
    
    // فارمیٹ میں بھیجیں JSON فرنٹ اینڈ کو ڈیٹا
    echo json_encode($users);

} catch (Exception $e) {
    // یہاں پلے ٹینشن (Plain Exception) مائیسکوئل کے تمام ایررز کو پکڑ لے گی
    echo json_encode(["error" => "Database operation failed: " . $e->getMessage()]);
}
?>