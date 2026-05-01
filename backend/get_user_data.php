<!-- <?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php';

// چیک کریں کہ کیا صارف لاگ ان ہے
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // یوزر اور اکاؤنٹ ٹیبل سے ڈیٹا حاصل کرنے کے لیے SQL
    $sql = "SELECT u.full_name, a.balance, a.account_number 
            FROM users u 
            JOIN accounts a ON u.user_id = a.user_id 
            WHERE u.user_id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    if ($data) {
        echo json_encode(["success" => true, "data" => $data]);
    } else {
        echo json_encode(["success" => false, "message" => "Data not found"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error"]);
}

$conn->close();
?> -->