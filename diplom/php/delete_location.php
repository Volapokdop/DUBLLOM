<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$locationId = $data['locationId'] ?? null;
$userId = $_SESSION['user_id'];

if (!$locationId) {
    echo json_encode(["status" => "error", "message" => "ID локации не указан"]);
    exit;
}

$stmt = $conn->prepare("SELECT user_id FROM locations WHERE id = ?");
$stmt->bind_param("i", $locationId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Локация не найдена"]);
    exit;
}

$location = $result->fetch_assoc();
if ($location['user_id'] != $userId) {
    echo json_encode(["status" => "error", "message" => "Вы не можете удалить эту локацию"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM location_events WHERE location_id = ?");
$stmt->bind_param("i", $locationId);
$stmt->execute();

$stmt = $conn->prepare("DELETE FROM locations WHERE id = ?");
$stmt->bind_param("i", $locationId);

if ($stmt->execute()) {
    if (!empty($location['image']) && file_exists($location['image'])) {
        unlink($location['image']);
    }
    echo json_encode(["status" => "success", "message" => "Локация успешно удалена"]);
} else {
    echo json_encode(["status" => "error", "message" => "Ошибка при удалении локации"]);
}

$stmt->close();
$conn->close();
?>
