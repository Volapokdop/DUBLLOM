<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Не авторизован"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;
$charCount = $input['charCount'] ?? 0;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "Нет userId"]);
    exit;
}

try {
    // Проверяем, новый ли это день
    $stmt = $conn->prepare("SELECT last_writing_date FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    $isNewDay = false;
    $lastDate = $user['last_writing_date'] ? new DateTime($user['last_writing_date']) : null;
    $today = new DateTime();

    if (!$lastDate || $lastDate->format('Y-m-d') !== $today->format('Y-m-d')) {
        $isNewDay = true;
    }

    // Обновляем статистику
    $stmt = $conn->prepare("
        UPDATE users
        SET
            total_chars = GREATEST(total_chars, ?),
            daily_chars = IF(?, ?, GREATEST(daily_chars, ?)),
            last_writing_date = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param("iiiii", $charCount, $isNewDay, $charCount, $charCount, $userId);
    $stmt->execute();

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
