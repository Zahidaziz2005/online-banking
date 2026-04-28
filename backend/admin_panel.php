<?php
require_once 'db_config.php';

// پہلا ایڈمن ڈیٹا
$name = "Nexus Admin";
$email = "admin@nexus.com";
$pass = password_hash("NexusAdmin@2026", PASSWORD_DEFAULT); // مضبوط پاس ورڈ

$sql = "INSERT INTO staff (full_name, email, password, role) VALUES (?, ?, ?, 'admin')";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $name, $email, $pass);

if ($stmt->execute()) {
    echo "<h1>Admin Table Created & Account Setup Done!</h1>";
} else {
    echo "Error: " . $conn->error;
}

// backend/staff_auth.php
if ($user_found_in_staff_table) {
    $_SESSION['staff_id'] = $row['staff_id'];
    $_SESSION['role'] = $row['role']; // admin, manager etc.
    echo json_encode(["success" => true, "redirect" => "admin_panel.html"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid Staff Credentials"]);
}

?>

