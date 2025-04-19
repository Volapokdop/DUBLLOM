<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_GET['id'])) {
    echo json_encode(["error" => "Не указан ID события"]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Пользователь не авторизован"]);
    exit;
}

$eventId = (int)$_GET['id'];
$userId = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT * FROM events WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $eventId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Событие не найдено или нет прав доступа"]);
    exit;
}

$event = $result->fetch_assoc();

// Получаем участников события
$stmtParticipants = $conn->prepare("SELECT character_id FROM event_participants WHERE event_id = ?");
$stmtParticipants->bind_param("i", $eventId);
$stmtParticipants->execute();
$resultParticipants = $stmtParticipants->get_result();

$participants = [];
while ($row = $resultParticipants->fetch_assoc()) {
    $participants[] = $row['character_id'];
}

$event['participants'] = $participants;

// Очищаем путь к изображению для безопасности
if (!empty($event['image'])) {
    $event['image'] = str_replace(['./', '../'], '', $event['image']);
    $event['image'] = 'uploads/events/' . basename($event['image']);
}

echo json_encode($event);

$stmt->close();
$stmtParticipants->close();
$conn->close();
?>
