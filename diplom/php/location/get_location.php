<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_GET['id']) || !isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Недостаточно данных"]);
    exit;
}

$locationId = (int)$_GET['id'];
$userId = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT * FROM locations WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $locationId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Локация не найдена"]);
    exit;
}

$location = $result->fetch_assoc();

// Получаем связанные события
$eventsStmt = $conn->prepare("SELECT event_id FROM location_events WHERE location_id = ?");
$eventsStmt->bind_param("i", $locationId);
$eventsStmt->execute();
$events = $eventsStmt->get_result()->fetch_all(MYSQLI_ASSOC);

$location['events'] = array_column($events, 'event_id');

// Корректируем путь к изображению
$location['image'] = str_replace(['../../', './'], '', $location['image']);

echo json_encode($location);

$stmt->close();
$conn->close();
?>
