<?php
// Database Configuration
$host = "localhost";
$username = "root";
$password = ""; 
$dbname = "nexus_bank";

// Connection بنانا
$conn = new mysqli($host, $username, $password, $dbname);

// کنکشن چیک کرنا
if ($conn->connect_error) {
    // اگر یہ ایک API ریکویسٹ ہے، تو JSON بھیجیں، ورنہ سادہ ٹیکسٹ
    if (strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
        header('Content-Type: application/json');
        die(json_encode(["success" => false, "message" => "Database Connection Failed"]));
    } else {
        die("Connection failed: " . $conn->connect_error);
    }
}

// نوٹ: یہاں سے header ہٹا دیا گیا ہے تاکہ یہ فائل 'Universal' رہے
?>