<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../db_config.php';

try {
    $response = [];

    // 1. پچھلے 24 گھنٹوں کے ٹوٹل ایونٹس (Total Events)
    $qTotal = "SELECT COUNT(*) as total FROM audit_logs WHERE created_at >= NOW() - INTERVAL 1 DAY";
    $resTotal = $conn->query($qTotal);
    $total_24h = $resTotal->fetch_assoc()['total'] ?? 0;

    // 2. انوملیز / فیلڈ لاگز کی گنتی (Anomalies Detected)
    // فرض کریں کہ اگر ایکشن میں 'Failed' کا لفظ ہے تو وہ انوملی ہے (آپ اپنے اسٹرکچر کے مطابق اسے بدل سکتے ہیں)
    $qAnomalies = "SELECT COUNT(*) as total FROM audit_logs WHERE action LIKE '%Failed%' AND created_at >= NOW() - INTERVAL 1 DAY";
    $resAnomalies = $conn->query($qAnomalies);
    $anomalies = $resAnomalies->fetch_assoc()['total'] ?? 0;

    // 3. پالیسی کمپلائنس کی گنتی (Compliance Percentage)
    // فارمولا: (کامیاب لاگز / کل لاگز) * 100
    $compliance = 100; // ڈیفالٹ 100% اگر کوئی لاگ نہ ہو
    if ($total_24h > 0) {
        $success_events = $total_24h - $anomalies;
        $compliance = round(($success_events / $total_24h) * 100, 1);
    }

    // رسپانس میں اسٹیٹس شامل کرنا
    $response['stats'] = [
        "total_events" => $total_24h,
        "anomalies" => $anomalies,
        "compliance" => $compliance . "%"
    ];

    // 4. مین آڈٹ لاگز کی لسٹ
    $query = "SELECT log_id, user_id, action, ip_address, device_info, created_at FROM audit_logs ORDER BY log_id DESC";
    $result = $conn->query($query);

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }

    $response['success'] = true;
    $response['logs'] = $logs;

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
?>