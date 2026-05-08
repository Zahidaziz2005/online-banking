<?php
/**
 * register_user.php - Apex Banking Registration API
 * Optimized with Transaction & Account Creation
 */

header("Content-Type: application/json");
require_once '../db_config.php';

// JSON ڈیٹا وصول کرنا
$content = file_get_contents("php://input");
$data = json_decode($content, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($data)) {
    
    // ڈیٹا کو ویری ایبلز میں محفوظ کرنا
    $full_name = $data['full_name'] ?? '';
    $email     = $data['email'] ?? '';
    $cnic      = $data['cnic'] ?? '';
    $phone     = $data['phone'] ?? '';
    $password  = $data['password'] ?? '';

    // 1. بنیادی تصدیق (Validation)
    if (empty($full_name) || empty($email) || empty($password) || empty($cnic)) {
        echo json_encode(["success" => false, "message" => "Fill all necessary (Name, Email, Password, CNIC)  fields"]);
        exit;
    }

    // 2. ڈیٹا بیس ٹرانزیکشن شروع کریں
    $conn->begin_transaction();

    try {
        // ای میل کی موجودگی چیک کرنا
        $checkEmail = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $checkEmail->bind_param("s", $email);
        $checkEmail->execute();
        if ($checkEmail->get_result()->num_rows > 0) {
            throw new Exception("Email is already registered");
        }

        // 3. پاس ورڈ ہیش کرنا
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // 4. 'users' ٹیبل میں یوزر رجسٹر کرنا
        $stmt = $conn->prepare("INSERT INTO users (full_name, email, password, cnic, phone) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $full_name, $email, $hashed_password, $cnic, $phone);
        $stmt->execute();
        
        $new_user_id = $conn->insert_id;

        // 5. اکاؤنٹ نمبر بنانا (APEX + 6 ہندسوں کی ID)
        $account_number = "APEX" . str_pad($new_user_id, 6, "0", STR_PAD_LEFT);
        $initial_balance = 500.00; 

        // 6. 'accounts' ٹیبل میں انٹری (PKR اور active اسٹیٹس کے ساتھ)
        $stmt2 = $conn->prepare("INSERT INTO accounts (user_id, account_number, balance, account_type, currency, status) VALUES (?, ?, ?, 'savings', 'PKR', 'active')");
        $stmt2->bind_param("isd", $new_user_id, $account_number, $initial_balance);
        $stmt2->execute();

        // کامیابی کی صورت میں ٹرانزیکشن محفوظ کریں
        $conn->commit();

        echo json_encode([
            "success" => true, 
            "message" => "رجسٹریشن کامیاب! آپ کا اکاؤنٹ نمبر $account_number ہے اور آپ کو 500 روپے بونس دیا گیا ہے۔",
            "account_no" => $account_number
        ]);

    } catch (Exception $e) {
        // کسی بھی غلطی پر رول بیک (Rollback)
        $conn->rollback();
        echo json_encode([
            "success" => false, 
            "message" => $e->getMessage()
        ]);
    }

    // اسٹیٹمنٹس بند کرنا
    if (isset($stmt)) $stmt->close();
    if (isset($stmt2)) $stmt2->close();

} else {
    echo json_encode(["success" => false, "message" => "Applicaton method is wrong"]);
}

$conn->close();
?>