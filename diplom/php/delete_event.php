<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$eventId = $data['eventId'] ?? null;
$userId = $_SESSION['user_id'];

if (!$eventId) {
    echo json_encode(["status" => "error", "message" => "ID события не указан"]);
    exit;
}

$stmt = $conn->prepare("SELECT user_id FROM events WHERE id = ?");
$stmt->bind_param("i", $eventId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Событие не найдено"]);
    exit;
}

$event = $result->fetch_assoc();
if ($event['user_id'] != $userId) {
    echo json_encode(["status" => "error", "message" => "Вы не можете удалить это событие"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM event_participants WHERE event_id = ?");
$stmt->bind_param("i", $eventId);
$stmt->execute();

$stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
$stmt->bind_param("i", $eventId);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Событие успешно удалено"]);
} else {
    echo json_encode(["status" => "error", "message" => "Ошибка при удалении события"]);
}

$stmt->close();
$conn->close();
?>
