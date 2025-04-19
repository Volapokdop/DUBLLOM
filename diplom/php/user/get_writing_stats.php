<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Не авторизован"]);
    exit;
}

$userId = $_GET['userId'] ?? null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "Нет userId"]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT daily_chars, total_chars FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    echo json_encode([
        "status" => "success",
        "dailyChars" => $data['daily_chars'],
        "totalChars" => $data['total_chars']
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
